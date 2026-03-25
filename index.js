const { Client, GatewayIntentBits, Partials, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
 
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration 
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});
 
// ===== CONFIG =====
const STAFF_ROLE_ID = "1463268597085507717";
const STAFF_ROLE_ID_2 = "1478799916410077295";
const STAFF_TICKETS_ID = "1480750004309332040"; // <--- AÑADE ESTA LÍNEA SI NO ESTÁ
const CLAN_ROLE_ID = "1459687732417921227";
const MUTE_ROLE_ID = "1477518735983251638";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151";
const CANAL_AVISOS = "1462533102130958437";
const CANAL_ROLES = "1464335122005491745";
const CANAL_SUGERENCIAS = "1477005989096984646";
const CANAL_COMANDOS = "1476614389749649523";
const CANAL_BIENVENIDAS = "1459690080607146167";
const CANAL_DIRECTOS = "1477722071202004992";
const CANAL_LOGS = "1462534103063724062"; 
 
 
// IDs DE ROLES PARA MENCIONES
const ROL_AVISOS = "1477748637202382888";
const ROL_DIRECTOS = "1477748975603023873";
 
const IMAGEN_FORMULARIO = "https://i.imgur.com/vpR9rSJ.png";
 
const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};
 
// NUEVOS ROLES DE NOTIFICACIONES 
const ROLES_NOTIF = {
  "📢": ROL_AVISOS,
  "🎥": ROL_DIRECTOS
};
 
let mensajeRolesGlobal = null;
const msgTracker = new Map();
 
client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);
 
  // Registro de Comandos
  const commands = [
    { name: 'info', description: 'Información del bot' },
    { name: 'comandos', description: 'Ver lista completa de comandos' },
    { name: 'jugar', description: 'Adivina el número del 1 al 100' },
    { name: 'chamba', description: 'Envía un mensaje de chamba', options: [{ name: 'mensaje', description: 'El mensaje a enviar', type: 3, required: true }] },
    { name: 'directo', description: 'Anunciar directo', options: [{ name: 'enlace', description: 'Link del directo', type: 3, required: true }, { name: 'juego', description: 'Juego', type: 3, required: true }] },
    { name: 'mute', description: 'Mutea a un usuario', options: [{ name: 'usuario', description: 'Usuario', type: 6, required: true }, { name: 'tiempo', description: 'Tiempo (min)', type: 4, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'unmute', description: 'Quita el mute a un usuario', options: [{ name: 'usuario', description: 'Usuario', type: 6, required: true }] },
 
    // NUEVOS COMANDOS
    { name: 'clear', description: 'Borrar mensajes', options: [{ name: 'cantidad', description: 'Cantidad de mensajes a borrar', type: 4, required: true }] },
    { name: 'miembros', description: 'Ver miembros online y estadísticas' },
    { name: 'reglas', description: 'Ver las normas del clan' },
    { name: 'top', description: 'Ver el top de miembros' },
    { name: 'stats', description: 'Ver estadísticas', options: [{ name: 'usuario', description: 'Usuario a ver', type: 6 }] },
    { name: 'suggest', description: 'Enviar una sugerencia', options: [{ name: 'texto', description: 'Tu sugerencia', type: 3, required: true }] },
    { name: 'anunciar', description: 'Mandar un aviso oficial', options: [{ name: 'mensaje', description: 'Contenido del aviso', type: 3, required: true }] },
    { name: 'kick', description: 'Expulsar usuario', options: [{ name: 'usuario', description: 'Usuario a expulsar', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'ban', description: 'Banear usuario', options: [{ name: 'usuario', description: 'Usuario a banear', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'warn', description: 'Advertir usuario', options: [{ name: 'usuario', description: 'Usuario a advertir', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
 
 
    // COMANDO SORTEO 
    { name: 'sorteo', description: 'Iniciar un sorteo', options: [
        { name: 'premio', description: '¿Qué se sortea?', type: 3, required: true },
        { name: 'duracion', description: 'Duración en minutos', type: 4, required: true }]},
  ];
 
  await client.application.commands.set(commands);
  console.log("Comandos slash actualizados en Discord.");
 
  const canal = await client.channels.fetch(CANAL_INICIAL);
  const mensajes = await canal.messages.fetch({ limit: 20 });
 
  const yaExiste = mensajes.find(
    m => m.author.id === client.user.id && m.components.length > 0
  );
 
  if (!yaExiste) {
    const boton = new ButtonBuilder()
      .setCustomId("crear_ticket")
      .setLabel("Solicitar verificación")
      .setStyle(ButtonStyle.Primary);
 
    const fila = new ActionRowBuilder().addComponents(boton);
 
    await canal.send({
      content: "📝 Solicitud de Acceso: Haz clic en el botón de abajo para completar el formulario de reclutamiento.",
      components: [fila]
    });
  }
});
 
// ===== SISTEMA DE LOGS dyno =====
client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const logChannel = message.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;
 
    const embed = new EmbedBuilder()
        .setTitle("🗑️ Mensaje Eliminado")
        .setDescription(`**Autor:** ${message.author.tag} (${message.author.id})\n**Canal:** <#${message.channel.id}>\n**Mensaje:** ${message.content || "No hay texto"}`)
        .setColor(0xFF0000)
        .setTimestamp();
    logChannel.send({ embeds: [embed] });
});
 
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    const logChannel = oldMessage.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;
 
    const embed = new EmbedBuilder()
        .setTitle("✏️ Mensaje Editado")
        .setDescription(`**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n**Antiguo:** ${oldMessage.content}\n**Nuevo:** ${newMessage.content}`)
        .setColor(0xFFA500)
        .setTimestamp();
    logChannel.send({ embeds: [embed] });
});
 
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const logChannel = newMember.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;
 
    // Detectar cambios de roles
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
 
    if (addedRoles.size > 0 || removedRoles.size > 0) {
        // BUSCAR QUIÉN HIZO EL CAMBIO EN LOS AUDIT LOGS
        // Esperamos un momento para que Discord registre la acción
        await Array.from({ length: 1 }); 
        const fetchedLogs = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type: 25, // MemberRoleUpdate
        });
 
        const roleLog = fetchedLogs.entries.first();
        let ejecutor = "Desconocido (Probablemente Bot)";
 
        // Verificamos que el log corresponda al usuario actualizado
        if (roleLog && roleLog.target.id === newMember.id) {
            ejecutor = roleLog.executor.tag;
        }
 
        if (addedRoles.size > 0) {
            logChannel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("🛡️ Roles Añadidos")
                    .setDescription(`**Usuario:** ${newMember.user.tag}\n**Roles:** ${addedRoles.map(r => r.name).join(", ")}\n**Hecho por:** ${ejecutor}`)
                    .setColor(0x00FF00)
                    .setTimestamp()]
            });
        }
 
        if (removedRoles.size > 0) {
            logChannel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("🛡️ Roles Eliminados")
                    .setDescription(`**Usuario:** ${newMember.user.tag}\n**Roles:** ${removedRoles.map(r => r.name).join(", ")}\n**Hecho por:** ${ejecutor}`)
                    .setColor(0xFF0000)
                    .setTimestamp()]
            });
        }
    }
});
 
// ===== BIENVENIDAS =====
client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(CANAL_BIENVENIDAS);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("👋 ¡Nuevo miembro!")
        .setDescription(`¡Bienvenido al **Clan ColmillosDelAlba** <@${member.id}>!\nPasala bien!! 🐉`) 
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage("https://i.imgur.com/BFAmZ4A.jpg") 
        .setFooter({ text: `Eres el miembro #${member.guild.memberCount}` })
        .setTimestamp();

    channel.send({ content: `¡Bienvenido <@${member.id}>!`, embeds: [embed] });
});

// SISTEMA DE REACCIONES (CORREGIDO)
client.on("messageReactionAdd", async (reaction, user) => { 
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    
    const member = await reaction.message.guild.members.fetch(user.id);

    // Lógica Roles de Clase
    if (ROLES_REACCIONES[reaction.emoji.name]) {
        const roleId = ROLES_REACCIONES[reaction.emoji.name];
        await member.roles.add(roleId).catch(() => {});
        const rol = reaction.message.guild.roles.cache.get(roleId);
        const m = await reaction.message.channel.send(`✅ Rol **${rol.name}** asignado.`);
        setTimeout(() => m.delete().catch(() => {}), 4000);
    }

    // Lógica Roles Notificaciones
    if (reaction.message.channel.id === CANAL_ROLES && ROLES_NOTIF[reaction.emoji.name]) {
        const roleId = ROLES_NOTIF[reaction.emoji.name];
        await member.roles.add(roleId).catch(() => {});
        const rol = reaction.message.guild.roles.cache.get(roleId);
        const m = await reaction.message.channel.send(`✅ Rol **${rol.name}** asignado.`);
        setTimeout(() => m.delete().catch(() => {}), 4000);
    }
}); // <--- ESTE ES EL CIERRE CORRECTO
 
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.channel.id !== CANAL_ROLES) return;
 
  const member = await reaction.message.guild.members.fetch(user.id);
 
  // Remover rol clase
  if (ROLES_REACCIONES[reaction.emoji.name]) {
      await member.roles.remove(ROLES_REACCIONES[reaction.emoji.name]).catch(() => {});
  }
  // Remover rol notif
  if (ROLES_NOTIF[reaction.emoji.name]) {
      await member.roles.remove(ROLES_NOTIF[reaction.emoji.name]).catch(() => {});
  }
 
  // VALIDACIÓN OBLIGATORIA (Notificaciones)
  const tieneNotif = member.roles.cache.has(ROL_AVISOS) || member.roles.cache.has(ROL_DIRECTOS);
 
  if (!tieneNotif) {
      const aviso = await reaction.message.channel.send({
          content: `⚠️ <@${user.id}> Debes tener al menos **uno** de los roles de notificaciones (📢 Avisos o 🎥 Directos). Por favor reacciona de nuevo.`
      });
      setTimeout(() => aviso.delete().catch(() => {}), 6000);
  }
});
 
// ===== AUTOMODERACIÓN =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
 
 
  // Anti-Spam (5 mensajes)
  const uid = message.author.id;
  if (!msgTracker.has(uid)) msgTracker.set(uid, []);
  let userMsgs = msgTracker.get(uid);
  userMsgs.push({ content: message.content.toLowerCase(), time: Date.now() });
  userMsgs = userMsgs.filter(m => Date.now() - m.time < 10000);
  msgTracker.set(uid, userMsgs);
 
  if (userMsgs.length >= 5) {
    const spam = userMsgs.every(m => m.content === message.content.toLowerCase());
    if (spam) {
      await message.channel.bulkDelete(5).catch(() => {});
      return message.channel.send(`🚫 No hagas spam, <@${uid}>.`).then(m => setTimeout(() => m.delete(), 4000));
    }
  }
 
  if (!message.guild) {
    const embedDM = new EmbedBuilder()
      .setTitle("🤖 Información del Bot")
      .setDescription("**Creado por 1fsi**\n\nVenta de bots personalizados.\nDiscord: **1fsi**")
      .setColor(0x00AEFF);
    await message.reply({ embeds: [embedDM] });
    return;
  }
 
  if (message.channel.id === CANAL_AVISOS) {
    await message.delete().catch(() => {});
    const embedAviso = new EmbedBuilder()
      .setTitle("🚨 AVISO IMPORTANTE 🚨")
      .setDescription(message.content)
      .setColor(0xFF0000)
      .setFooter({ text: `Publicado por ${message.author.tag}` })
      .setTimestamp();
    await message.channel.send({ content: `<@&${ROL_AVISOS}>`, embeds: [embedAviso] });
  }
});
 
// ===== INTERACCIONES (COMANDOS Y TICKETS) =====
client.on("interactionCreate", async (interaction) => {
// --- RECEPTOR DEL FORMULARIO (NUEVO Y MEJORADO) ---
 if (interaction.isModalSubmit() && interaction.customId === 'modal_reclutamiento') {
    // Extraemos los datos con los IDs nuevos
    const datos = interaction.fields.getTextInputValue('f_datos');
    const especialidad = interaction.fields.getTextInputValue('f_especialidad');
    const experiencia = interaction.fields.getTextInputValue('f_exp');
    const disponibilidad = interaction.fields.getTextInputValue('f_dispo');
    const microfono = interaction.fields.getTextInputValue('f_mic');

    const embedRespuestas = new EmbedBuilder()
        .setTitle("⚔️ NUEVA SOLICITUD RECIBIDA ⚔️")
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x00FF00)
        .setDescription(`El aspirante <@${interaction.user.id}> ha enviado su postulación oficial.`)
        .addFields(
            { name: '👤 Datos Personales', value: `\`\`\`${datos}\`\`\``, inline: false },
            { name: '🎮 Perfil de Jugador', value: `\`\`\`${especialidad}\`\`\``, inline: false },
            { name: '⏳ Tiempo en el Juego', value: `\`\`\`${experiencia}\`\`\``, inline: true },
            { name: '🎤 Comunicación', value: `\`\`\`${microfono}\`\`\``, inline: true },
            { name: '⏰ Disponibilidad', value: `\`\`\`${disponibilidad}\`\`\``, inline: false }
        )
        .setFooter({ text: "Evaluación de Actitud y Compromiso" })
        .setTimestamp();

    // Enviamos el mensaje al canal del ticket
    await interaction.channel.send({ embeds: [embedRespuestas] }).catch(() => {});
    
    // Respuesta obligatoria para que no salga "error" en Discord
    return interaction.reply({ content: "✅ Tu solicitud ha sido enviada correctamente al Staff.", ephemeral: true });
  }
  if (interaction.isChatInputCommand()) { // <--- ESTE ES EL SIGUIENTE BLOQUE
    const { commandName, options, guild, member } = interaction;
 
 
    if (commandName === "info") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🐺 Bot Del Clan ColmillosDelAlba")
            .setDescription("Creado y personalizado desde 0 por el usuario **1fsi.**\n\nSi te interesa crear tu bot, manda soli al DM de **1fsi.**.")
            .setColor(0x8B0000)
            .setFooter({ text: "ColmillosDelAlba 2026" })
        ]
      });
    }
 
    if (commandName === "comandos") {
      const embedComandos = new EmbedBuilder()
        .setTitle("📜 Lista de Comandos")
        .setDescription(`
**Comandos Públicos:**
• \`/info\`: Información del bot.
• \`/comandos\`: Ver esta lista.
• \`/jugar\`: Juego de adivinar número.
• \`/reglas\`: Normas del clan.
• \`/miembros\`: Estadísticas de usuarios.
• \`/suggest\`: Enviar sugerencia.
• \`/stats\`: Ver estadísticas.
 
**Comandos de Staff:**
• \`/clear [cantidad]\`: Borrar mensajes.
• \`/role add [usuario] [rol]\`: Añadir rol a usuario.
• \`/directo\`: Anunciar directo.
• \`/mute\`: Mutear usuario.
• \`/unmute\`: Desmutear usuario.
• \`/chamba\`: Enviar mensaje decorado.
• \`/anunciar\`: Mandar aviso oficial.
• \`/kick\`: Expulsar usuario.
• \`/ban\`: Banear usuario.
• \`/warn\`: Advertir usuario.
• \`/sorteo [premio] [duracion]\`: Iniciar sorteo (Staff).`)
        .setColor(0x8B0000);
      return interaction.reply({ embeds: [embedComandos] });
    }
 
    // ===== JUGAR =====
    if (commandName === "jugar") {
        const number = Math.floor(Math.random() * 100) + 1;
        let attempts = 0;
        let guessMessages = [];
        const msgPrincipal = await interaction.reply({ content: `¡Hola <@${interaction.user.id}>! He pensado un número del 1 al 100. ¡Adivínalo!`, fetchReply: true });
        guessMessages.push(msgPrincipal);
 
        const collector = interaction.channel.createMessageCollector({ time: 60000 });
        collector.on('collect', async m => {
            if (m.author.bot) return;
            attempts++;
            const guess = parseInt(m.content);
            if (isNaN(guess)) return;
 
            guessMessages.push(m); 
 
            if (guess === number) {
                await m.reply(`🎉 ¡Correcto <@${m.author.id}>! Adivinaste el número **${number}** en ${attempts} intentos.`);
                collector.stop();
            } else if (guess < number) {
                const reply = await m.reply('⬆️ Más alto.');
                guessMessages.push(reply); 
            } else {
                const reply = await m.reply('⬇️ Más bajo.');
                guessMessages.push(reply); 
            }
        });
 
        collector.on('end', async () => {
            // Borrar todos los mensajes del juego
            for (const msg of guessMessages) {
                await msg.delete().catch(() => {});
            }
        });
 
        return;
    }
 
    // ===== CHAMBA =====
    if (commandName === "chamba") {
        if (interaction.user.id !== "777529808325181460") return interaction.reply({ content: "❌ Solo guepar__ puede usar este comando.", ephemeral: true });
 
        const text = options.getString("mensaje");
        const embedChamba = new EmbedBuilder()
            .setTitle("📢 MENSAJE OFICIAL DE GUEPAR")
            .setDescription(text)
            .setColor(0xFFFF00)
            .setImage("https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e.png")
            .setFooter({ text: "Att: guepar__" })
            .setTimestamp();
 
        await interaction.reply({ content: "✅ Aviso enviado.", ephemeral: true });
        await interaction.channel.send({ embeds: [embedChamba] });
        return;
    }
 
    // ===== DIRECTO =====
    if (commandName === "directo") {
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const enlace = options.getString("enlace");
        const juego = options.getString("juego");
 
        const canalDirectos = guild.channels.cache.get(CANAL_DIRECTOS);
        if (!canalDirectos) return interaction.reply({ content: "❌ Canal de directos no encontrado.", ephemeral: true });
 
        const embedDirecto = new EmbedBuilder()
            .setTitle("🎥 ¡ESTAMOS EN DIRECTO! 🎥")
            .setDescription(`**${interaction.user.username}** está transmitiendo **${juego}**.\n\n👉 [¡Click aquí para verlo!](${enlace})`)
            .setColor(0x9146FF)
            .setTimestamp();
 
        await interaction.reply({ content: `✅ Anuncio de directo enviado a <#${CANAL_DIRECTOS}>.`, ephemeral: true });
        // CAMBIO: Mención de rol en lugar de everyone
        await canalDirectos.send({ content: `<@&${ROL_DIRECTOS}>`, embeds: [embedDirecto] });
        return;
    }
 
    // ===== MUTE =====
    if (commandName === "mute") {
        if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const target = options.getMember("usuario");
        const tiempo = options.getInteger("tiempo");
        const razon = options.getString("razon") || "No especificada";
 
        if (!target) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
 
        const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
        if (!muteRole) return interaction.reply({ content: "❌ No se encontró el rol de muteo.", ephemeral: true });
 
        await target.roles.add(muteRole);
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🔇 Usuario Muteado").setDescription(`**Usuario:** ${target.user.tag}\n**Tiempo:** ${tiempo} min\n**Razón:** ${razon}`).setColor(0xFFA500)] });
 
        setTimeout(async () => {
            await target.roles.remove(muteRole).catch(() => {});
        }, tiempo * 60000);
        return;
    }
 
    // ===== UNMUTE =====
    if (commandName === "unmute") {
        if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const target = options.getMember("usuario");
        if (!target) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
 
        const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
        if (!muteRole) return interaction.reply({ content: "❌ No se encontró el rol de muteo.", ephemeral: true });
 
        await target.roles.remove(muteRole);
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🔊 Usuario Desmuteado").setDescription(`**Usuario:** ${target.user.tag}`).setColor(0x00FF00)] });
        return;
    }
 
    // ===== CLEAR (NUEVO) =====
    if (commandName === "clear") {
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const amount = options.getInteger("cantidad");
        if (amount < 1 || amount > 100) return interaction.reply({ content: "❌ Pon un número entre 1 y 100.", ephemeral: true });
 
        await interaction.channel.bulkDelete(amount, true);
        const reply = await interaction.reply({ content: `✅ Eliminados **${amount}** mensajes.`, ephemeral: true });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        return;
    }
 
if (commandName === "reglas") {
    // Definimos el texto fuera para evitar errores de sintaxis en el constructor del Embed
    const textoReglas = [
      "# ─── 🟣 **REGLAS DE DISCORD** ───",
      "",
      "### 1️⃣ 🤝 **Respeto y Convivencia**",
      "> * Tratar a todos con respeto.",
      "> * Nada de insultos, racismo o comportamiento tóxico. 🚫",
      "",
      "### 2️⃣ 💬 **Chat y Orden**",
      "> * Evitar el **spam**. 📨",
      "> * No generar conflictos innecesarios.",
      "> * Mantener los canales organizados. 📂",
      "> * ❌ **No mandar links** de servidores externos.",
      "",
      "### 3️⃣ ⚡ **Participación y Actividad**",
      "> * Mantenerse activo. Plazo de **15 días** de tolerancia. ⏳",
      "> * Sin actividad, el miembro **será expulsado**.",
      "> * Justificar inactividad avisando **antes** a un líder. 📝",
      "",
      "### 4️⃣ 👑 **Conflictos y Liderazgo**",
      "> * Conflictos deberán hablarse con un líder.",
      "> * Seguir las decisiones de los líderes. 🛡️",
      "> * Proponer ideas de manera respetuosa.",
      "",
      "─────────────────────────────",
      "",
      "# ─── 🟢 **REGLAS DE MINECRAFT** ───",
      "### `dioses.mc`",
      "",
      "### 1️⃣ ⚔️ **Roles y Actividades**",
      "> * **Roles:** ⚔ `PvP` | 🛠️ `Builder` | 🎲 `Casual`",
      "> * Apoyar en aventuras, guerras y construcciones. 🛡️",
      "",
      "### 2️⃣ 🤝 **Trabajo en Equipo**",
      "> * Compartir recursos y coordinar ataques/defensas. 💎",
      "",
      "### 3️⃣ 🚫 **Prohibido Trampas**",
      "> * Nada de hacks, cheats o exploits.",
      "> * ❌ Incumplir deriva en **expulsión** del clan y Discord.",
      "",
      "### 4️⃣ 🧱 **Construcciones**",
      "> * ❌ No grifear ni destruir construcciones ajenas.",
      "> * Preguntar antes de construir en zonas del clan. 🏗️",
      "",
      "─────────────────────────────",
      "",
      "# ─── ⚖️ **SANCIONES** ───",
      "> 1. Mute 1h | 2. Mute 5h | 3. Mute 12h",
      "> 4. Mute 1d | 5. ⚠️ **AVISO** 5d | 6. ❌ **Expulsión**",
      "",
      "─────────────────────────────",
      "",
      "# ─── 🏹 **LIDERAZGO** ───",
      "🛡️ <@&1459685194603823189> — <@777529808325181460>",
      "🛡️ <@&1459688412356280623> — <@1042214255358910514>",
      "🛡️ <@&1474178918549295156> — <@525815527117946892>",
      "🛡️ <@&1466692938607099904> — <@1157178540865896580>",
      "🛡️ <@&1478610757569744917> — <@670690283117084684>",
      "🛡️ <@&1466694077104914576> — <@478093856668123148>",
      "🛡️ <@&1466693381454434471> — <@722044088890818570>",
      "",
      "🔥🌅 ¡Que **ColmillosdelAlba** crezca unido y legendario! 🌅🐉"
    ].join("\n"); // Esto junta todas las líneas con un salto de línea

    const embedReglas = new EmbedBuilder()
      .setTitle("📜 REGLAS COLMILLOS DEL ALBA")
      .setDescription(textoReglas)
      .setColor(0x8B0000);

    return interaction.reply({
      content: "@everyone",
      embeds: [embedReglas],
      allowedMentions: { parse: ["everyone"] }
    });
  }
 
    if (commandName === "miembros") {
      const online = guild.members.cache.filter(m => m.presence?.status !== 'offline' && m.presence?.status !== undefined).size;
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle("👥 Estadísticas").setDescription(`🟢 Online: **${online}**\n👥 Total: **${guild.memberCount}**`).setColor(0x00FF00)]
      });
    }
 
    if (commandName === "anunciar") {
      // Verificación de ambos roles de Staff
      if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) {
          return interaction.reply({ content: "❌ No eres staff.", ephemeral: true });
      }
 
      const canalAvisos = guild.channels.cache.get(CANAL_AVISOS);
      const m = options.getString("mensaje");
 
      await canalAvisos.send({ 
        content: `<@&${ROL_AVISOS}>`, 
        embeds: [new EmbedBuilder().setTitle("📢 ANUNCIO OFICIAL").setDescription(m).setColor(0xFF0000).setTimestamp()] 
      });
      return interaction.reply({ content: "✅ Anuncio enviado.", ephemeral: true });
    }
 
    if (["kick", "ban", "warn"].includes(commandName)) {
      // Verificación de ambos roles de Staff
      if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.roles.cache.has(STAFF_ROLE_ID_2)) {
          return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
      }
 
      const target = options.getUser("usuario");
      const razon = options.getString("razon") || "Sin razón especificada";
      const embedMod = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTimestamp()
          .setFooter({ text: `Staff: ${interaction.user.tag}` });
 
      if (commandName === "kick") {
        await guild.members.kick(target, razon);
        embedMod.setTitle("👢 Usuario Expulsado").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      } else if (commandName === "ban") {
        await guild.members.ban(target, { reason: razon });
        embedMod.setTitle("🔨 Usuario Baneado").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      } else {
        embedMod.setTitle("⚠️ Advertencia").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      }
      return interaction.reply({ embeds: [embedMod] });
    }
 
      if (commandName === "suggest") {
      // 1. Verificamos el canal (Mantenemos el return aquí)
      if (interaction.channel.id !== CANAL_COMANDOS) {
        return interaction.reply({ content: "❌ Este comando solo se puede usar en el canal de comandos.", ephemeral: true });
      }
 
      const texto = options.getString("texto");
      const canalSugerencias = await client.channels.fetch(CANAL_SUGERENCIAS);
 
      const embedSugerencia = new EmbedBuilder()
        .setTitle("📌 Nueva Sugerencia")
        .setDescription(texto)
        .setColor(0x8B0000)
        .setFooter({ text: `Sugerido por ${interaction.user.tag}` })
        .setTimestamp();
 
      // 2. 
      const mensaje = await canalSugerencias.send({ embeds: [embedSugerencia] });
 
      // 3. 
      await mensaje.react("👍");
      await mensaje.react("👎");
 
      // 4. 
      return interaction.reply({ content: "✅ Tu sugerencia fue enviada correctamente.", ephemeral: true });
    }
 
    // ===== COMANDO /STATS (INTEGRADO) =====
    if (commandName === "stats") {
        const targetMember = options.getMember("usuario") || member;
 
        const joinedAt = targetMember.joinedAt.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
 
        const roles = targetMember.roles.cache
            .filter(role => role.id !== guild.id)
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'Ninguno';
 
        const embedStats = new EmbedBuilder()
            .setTitle(`📊 Estadísticas de ${targetMember.user.username}`)
            .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x8B0000)
            .addFields(
                { name: '👤 Usuario', value: `${targetMember.user.tag}`, inline: true },
                { name: '🆔 ID', value: `${targetMember.user.id}`, inline: true },
                { name: '📅 Se unió el', value: `${joinedAt}`, inline: true },
                { name: '🛡️ Roles', value: roles }
            )
            .setFooter({ text: `Consultado por ${interaction.user.tag}` })
            .setTimestamp();
 
        return interaction.reply({ embeds: [embedStats] });
    }
 
    if (commandName === "top") {
        return interaction.reply({ content: "📊 Comando en desarrollo.", ephemeral: true });
    }
 // ===== LÓGICA COMANDO /SORTEO =====
    if (commandName === "sorteo") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const premio = options.getString("premio");
        const duracion = options.getInteger("duracion");

        const embedSorteo = new EmbedBuilder()
            .setTitle("🎉 ¡NUEVO SORTEO! 🎉")
            .setDescription(`Premio: **${premio}**\n\nReacciona con 🎟️ para participar.\nDuración: ${duracion} minutos.`)
            .setColor(0x00FF00)
            .setFooter({ text: `Sorteo iniciado por ${interaction.user.username}` })
            .setTimestamp(Date.now() + duracion * 60000);

        await interaction.reply({ content: "✅ Sorteo creado.", ephemeral: true });
        const mensajeSorteo = await interaction.channel.send({ content: "@everyone", embeds: [embedSorteo] });
        await mensajeSorteo.react("🎟️");

        setTimeout(async () => {
            const fetchedMessage = await mensajeSorteo.fetch();
            const reactions = fetchedMessage.reactions.cache.get("🎟️");

            if (!reactions || reactions.count <= 1) {
                return interaction.channel.send("😞 No hubo suficientes participantes para el sorteo.");
            }

            const users = await reactions.users.fetch();
            const participants = users.filter(u => !u.bot);

            if (participants.size === 0) {
                return interaction.channel.send("😞 No hubo participantes para el sorteo.");
            }

            const winner = participants.random();

            const embedGanador = new EmbedBuilder()
                .setTitle("🏆 ¡Tenemos un Ganador! 🏆")
                .setDescription(`Premio: **${premio}**\n\nFelicidades <@${winner.id}> por ganar el sorteo.\nGracias a todos por participar.`)
                .setColor(0xFFD700)
                .setThumbnail(winner.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "Sorteo finalizado" })
                .setTimestamp();

            await interaction.channel.send({ content: `🎉 ¡El sorteo ha terminado!`, embeds: [embedGanador] });

            const logChannel = guild.channels.cache.get(CANAL_LOGS);
            if(logChannel) {
                logChannel.send(`🏆 **${premio}** fue ganado por **${winner.tag}**`);
            }
}, duracion * 60000);
        return;
    } // Cierra if sorteo

    // ===== AQUÍ TERMINAN LOS COMANDOS SLASH =====
  } 

  // ===== AQUÍ EMPIEZA LA LÓGICA DE MODALS Y BOTONES =====
if (interaction.isModalSubmit() && interaction.customId === 'modal_reclutamiento') {
        const datos = interaction.fields.getTextInputValue('f_datos');
        const especialidad = interaction.fields.getTextInputValue('f_especialidad');
        const experiencia = interaction.fields.getTextInputValue('f_exp');
        const disponibilidad = interaction.fields.getTextInputValue('f_dispo');
        const microfono = interaction.fields.getTextInputValue('f_mic');

        const embedRespuestas = new EmbedBuilder()
            .setTitle("⚔️ NUEVA SOLICITUD RECIBIDA ⚔️")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x00FF00)
            .setDescription(`El aspirante <@${interaction.user.id}> ha enviado su postulación oficial.`)
            .addFields(
                { name: '👤 Datos Personales', value: `\`\`\`${datos}\`\`\``, inline: false },
                { name: '🎮 Perfil de Jugador', value: `\`\`\`${especialidad}\`\`\``, inline: false },
                { name: '⏳ Tiempo en el Juego', value: `\`\`\`${experiencia}\`\`\``, inline: true },
                { name: '🎤 Comunicación', value: `\`\`\`${microfono}\`\`\``, inline: true },
                { name: '⏰ Disponibilidad', value: `\`\`\`${disponibilidad}\`\`\``, inline: false }
            )
            .setFooter({ text: "Evaluación de Actitud y Compromiso" })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embedRespuestas] });
        return interaction.reply({ content: "✅ Tu solicitud ha sido enviada correctamente. El Staff la revisará pronto.", ephemeral: true });
    }

    // 2. Manejo de Botones
    if (!interaction.isButton()) return;

    if (interaction.customId === "crear_ticket") {
        const nombreCanal = `verificacion-${interaction.user.id}`;
        const existingChannel = interaction.guild.channels.cache.find(c => c.name === nombreCanal);
        if (existingChannel) return interaction.reply({ content: "❌ Ya tienes un ticket abierto.", ephemeral: true });

        const canal = await interaction.guild.channels.create({
            name: nombreCanal,
            type: ChannelType.GuildText,
            parent: CATEGORIA_TICKETS,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: STAFF_TICKETS_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

         const embedFormulario = new EmbedBuilder()
            .setTitle("⚔️ RECLUTAMIENTO: COLMILLOS DEL ALBA ⚔️")
            .setDescription(
                "**Bienvenido aspirante.**\n\nBuscamos guerreros con disciplina, constancia y lealtad. Para iniciar tu proceso, haz clic en el botón **\"📝 Iniciar Formulario\"**.\n\n" +
                "⚠️ **IMPORTANTE:**\n> * Las solicitudes poco serias serán rechazadas.\n> * Se evaluará actitud, nivel y compromiso."
            )
            .addFields(
                { name: '📜 Requisito Mínimo', value: 'Disponer de Micrófono y Discord activo.', inline: true },
                { name: '⏳ Evaluación', value: 'El Staff revisará tu perfil en breve.', inline: true }
            )
            .setColor(0x8B0000) 
            .setImage(IMAGEN_FORMULARIO)
            .setFooter({ text: "Forjamos lealtad y poder • Colmillos del Alba" })
            .setTimestamp();
  
        const fila1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("abrir_formulario").setLabel("📝 Iniciar Formulario").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("reclamar_ticket").setLabel("🙋‍♂️ Reclamar Ticket").setStyle(ButtonStyle.Primary)
        );

        const fila2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("aceptar_miembro").setLabel("Aceptar").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("rechazar_miembro").setLabel("Rechazar").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("cerrar_ticket").setLabel("Cerrar").setStyle(ButtonStyle.Secondary)
        );

        await canal.send({ content: `<@&${STAFF_TICKETS_ID}> <@${interaction.user.id}>`, embeds: [embedFormulario], components: [fila1, fila2] });
        await interaction.reply({ content: "✅ Ticket creado.", ephemeral: true });
    }

if (interaction.customId === "abrir_formulario") {
        const modal = new ModalBuilder().setCustomId('modal_reclutamiento').setTitle('SOLICITUD DE INGRESO');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('f_datos').setLabel("NICK / EDAD / GENERO / PAÍS").setPlaceholder("Ej: Nick: jose / edad: 20 / Genero: Masculino / Pais: España").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('f_especialidad').setLabel("ESPECIALIDAD: CONSTRCUTOR, FARMER, TECNICO O PVP Y NIVEL PVP").setPlaceholder("Ej: PvP y Constructor - Nivel: Alto").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('f_exp').setLabel("AÑOS DE EXPERIENCIA EN MC").setPlaceholder("¿Cuántos años llevas jugando?").setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('f_dispo').setLabel("DISPONIBILIDAD SEMANAL").setPlaceholder("Días y horarios en los que sueles conectar").setStyle(TextInputStyle.Paragraph).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('f_mic').setLabel("¿TIENES MICRÓFONO Y DISCORD ACTIVO?").setPlaceholder("Sí/No - Explica brevemente").setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
        await interaction.showModal(modal);
    }

 if (interaction.customId === "reclamar_ticket") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(STAFF_TICKETS_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        return interaction.reply({ content: `✅ El ticket ha sido reclamado por el staff <@${interaction.user.id}>.` });
    }
// --- LÓGICA DE ACEPTAR Y RECHAZAR (ACTUALIZADA) ---
    if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(STAFF_TICKETS_ID)) {
            return interaction.reply({ content: "❌ No tienes permiso para usar estos botones.", ephemeral: true });
        }

        // Buscamos al dueño del ticket (por el ID guardado en el topic del canal)
        const targetMember = await interaction.guild.members.fetch(interaction.channel.topic).catch(() => null);

        if (interaction.customId === "aceptar_miembro") {
            // 1. Dar el rol automáticamente
            if (targetMember) {
                await targetMember.roles.add("1459687732417921227").catch(() => {});
            }

            await interaction.reply({ 
                content: `✅ **ASPIRANTE ACEPTADO**\nEl rol ha sido asignado. El canal se eliminará en 15 segundos.` 
            });

            // 2. Borrar canal en 15 segundos
            setTimeout(() => interaction.channel.delete().catch(() => {}), 15000);

        } else {
            // --- LÓGICA DE RECHAZO ---
            const embedRechazo = new EmbedBuilder()
                .setTitle("⚔️ ESTADO DE POSTULACIÓN: COLMILLOS DEL ALBA ⚔️")
                .setColor(0xFF0000)
                .setDescription(
                    `Saludos aspirante.\n\nLamentamos informarte que, tras revisar tu postulación, **tu solicitud de ingreso ha sido rechazada**.\n\n` +
                    `Buscamos un nivel de compromiso, disciplina y perfil técnico que no hemos identificado en esta ocasión.\n\n*Atentamente, el Alto Mando de Colmillos del Alba.*`
                )
                .setFooter({ text: "Forjamos lealtad y poder." })
                .setTimestamp();

            // 1. Mandar mensaje privado (DM) profesional
            if (targetMember) {
                await targetMember.send({ embeds: [embedRechazo] }).catch(() => {});
            }

            await interaction.reply({ 
                content: `❌ **ASPIRANTE RECHAZADO**\nSe ha enviado el comunicado oficial por privado. El canal se eliminará en 15 segundos.` 
            });

            // 2. Borrar canal en 15 segundos
            setTimeout(() => interaction.channel.delete().catch(() => {}), 15000);
        }
    }
    if (interaction.customId === "cerrar_ticket") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(STAFF_TICKETS_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        await interaction.channel.delete().catch(() => {});
    }
});

client.login(process.env.TOKEN);
    
