// Menambahkan Dependencies
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useSingleFileAuthState 
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom")
const { state, saveState } = useSingleFileAuthState("./login.json");

//Bagian Coding ChatGPT
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);

//Fungi OpenAI ChatGPT untuk mendapatkan Respon
async function generateResponse(text) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: text,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
    });
    return response.data.choices[0].text;
}

// Fungsi Utama McDohL WA Bot
async function connectToWhatsApp(){

    // Buat sebuah koneksi baru ke WhatsApp
    const sock = makeWASocket({
        auth : state, 
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined
    });

    // Fungsi untuk Mantau Koneksi Update
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === "close" ){
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Koneksi terputus", lastDisconnect.error, "Hubungkan kembali!", shouldReconnect);
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        }
        else if( connection === "open") {
            console.log("Koneksi tersambung")
        }
    });
    sock.ev.on("creds.update", saveState);

    // Fungsi Untuk Memantau Pesan Masuk
    sock.ev.on("messages.upsert", async ({messages, type  }) => {
        console.log("Tipe Pesan: ", type);
        console.log(messages);
        if  (type === "notify" && !messages[0].key.fromMe) {
            try {
                
                //Dapatkan nomor pengirim dan isi pesan
                const senderNumber = messages[0].key.remoteJid;
                let incomingMessages = messages[0].message.conversation;
                if(incomingMessages === ""){
                    incomingMessages = messages[0].message.extendedTextMessage.text;
                }
                incomingMessages = incomingMessages.toLowerCase();

                //Dapatkan Info Pesan dari Grup atau bukan
                //Dan Pesan Memanggil BOT  atau tidak
                const isMessageFromGroup = senderNumber.includes("@g.us");
                const isMessageMentionBot = incomingMessages.includes("@6285155430345");

                //Tampilkan nomor pengirim dan isi pesan
                console.log("Nomor Pengirim:", senderNumber);
                console.log("Isi Pesan:", incomingMessages);

                //Tampilkan Status Pesan dari Grup atau Bukan
                //Tampilkan Status Pesan Mention BOT atau tidak
                console.log("Apakah Pesan Dari Grup? ", isMessageFromGroup);
                console.log("Apakah Pesan Menyebut BOT? ", isMessageMentionBot);

                //Kalo misalkan nanya langsung ke Bot / JAPRI
                if (!isMessageFromGroup) {

                    //Jika ada yang mengirim pesan mengandung kata 'siapa'
                    if (incomingMessages.includes('siapa') && incomingMessages.includes('kamu')) {
                        await sock.sendMessage(
                            senderNumber,
                            { text: "Saya BOT McDohL!" },
                            { quoted: messages[0] },
                            2000
                        );
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessages);
                            console.log(result);
                            await sock.sendMessage(
                                senderNumber,
                                { text: result + "\n\n" },
                                { quoted: messages[0] },
                                2000
                            );
                        }
                        main();
                    }
                }

                //Kalau Misalkan nanya ke BOT via Grup
                if (isMessageFromGroup && isMessageMentionBot) {
                    //Jika ada yang mengirim pesan mengandung kata 'siapa'
                    if (incomingMessages.includes('siapa') && incomingMessages.includes('kamu')) {
                        await sock.sendMessage(
                            senderNumber,
                            { text: "Saya BOT McDohL!" },
                            { quoted: messages[0] },
                            2000
                        );
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessages);
                            console.log(result);
                            await sock.sendMessage(
                                senderNumber,
                                { text: result + "\n\n" },
                                { quoted: messages[0] },
                                2000
                            );
                        }
                        main();
                    }
                }

                

            }catch(error){
                console.log(error);
            }
        }
    });

}

connectToWhatsApp().catch((err) => {
    console.log("Ada Error: " + err);
});