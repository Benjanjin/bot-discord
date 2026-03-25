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
      content: "Haz clic aquí para solicitar acceso al clan:",
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
 
// ===== REACCIONES ROLES =====
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
 
  const member = await reaction.message.guild.members.fetch(user.id);
 
  // Lógica Roles Clases
  if (reaction.message.channel.id === CANAL_ROLES && ROLES_REACCIONES[reaction.emoji.name]) {
      const roleId = ROLES_REACCIONES[reaction.emoji.name];
      const rolesSistema = Object.values(ROLES_REACCIONES);
 
      const yaTieneOtro = rolesSistema.some(id =>
        id !== roleId && member.roles.cache.has(id)
      );
 
      if (yaTieneOtro) {
        await reaction.users.remove(user.id).catch(() => {});
        const aviso = await reaction.message.channel.send({
          content: `❌ <@${user.id}> Solo puedes tener **un rol** de clase a la vez.`
        });
        setTimeout(() => aviso.delete().catch(() => {}), 4000);
        return;
      }
 
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
});
 
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
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_reclutamiento') {
      const nick = interaction.fields.getTextInputValue('f_nick');
      const datos = interaction.fields.getTextInputValue('f_datos');
      const espec = interaction.fields.getTextInputValue('f_especialidad');
      const exp = interaction.fields.getTextInputValue('f_exp');
      const mic = interaction.fields.getTextInputValue('f_mic');

      const embedRespuestas = new EmbedBuilder()
        .setTitle("📝 SOLICITUD COMPLETADA")
        .setDescription(`El usuario <@${interaction.user.id}> ha enviado su formulario.`)
        .setColor(0x00FF00)
        .addFields(
          { name: '👤 Nick', value: nick, inline: true },
          { name: '🌎 Datos', value: datos, inline: true },
          { name: '🎮 Especialidad', value: espec, inline: true },
          { name: '⏳ Exp/Tiempo', value: exp },
          { name: '🎤 Micrófono', value: mic }
        )
        .setTimestamp();

      // Esto lo manda al canal del ticket para que el Staff lo lea
      await interaction.channel.send({ embeds: [embedRespuestas] });
      
// Esto le confirma al usuario que todo salió bien (solo lo ve él)
      return interaction.reply({ content: "✅ Tu formulario ha sido enviado correctamente.", ephemeral: true });
    }
  } // <--- ASEGÚRATE QUE ESTA LLAVE ESTÉ AQUÍ
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
  const embedReglas = new EmbedBuilder()
    .setTitle("📜 REGLAS COLMILLOS DEL ALBA")
    .setDescription(`
🟣 **REGLAS DE DISCORD**
 
1️⃣ 🔹 **Respeto y convivencia**
- Tratar a todos con respeto.
- Nada de insultos, racismo o comportamiento tóxico.
 
2️⃣ 🔹 **Chat ordenado**
- Evitar spam.
- No generar conflictos innecesarios.
- Mantener los canales organizados según su función.
- ❌ No mandar links de servidores externos.
 
3️⃣ 🔹 **Participación y actividad**
- Mantenerse activo en el servidor.
- Habrá un plazo de **15 días** de tolerancia a la inactividad.
- Si después de ese plazo no hay actividad, el miembro **será expulsado**.
- La inactividad solo se justifica si se avisa **antes** a un líder y se presenta una razón válida.
 
4️⃣ 🔹 **Conflictos y liderazgo**
- Cualquier conflicto deberá hablarse con un líder.
- Seguir las decisiones de los líderes.
- Proponer ideas de manera respetuosa y constructiva.
 
─────────────────────────────
 
🟢 **REGLAS DE MINECRAFT (dioses.mc)**
 
1️⃣ 🔹 **Roles y actividades.**
- Cumplir con tu rol: ⚔ PvP | 🛠️ Builder | 🎲 Casual
- Apoyar al clan en aventuras, guerras y construcciones
- ⚔ PvP: si no hay combates activos, ayudar en construcciones
 
2️⃣ 🔹 **Trabajo en equipo**
- Compartir recursos cuando sea necesario.
- Coordinar ataques y defensas como un verdadero equipo.
 
3️⃣ 🔹 **Prohibido hacer trampas**
- Nada de hacks, cheats o exploits.
- ❌ Incumplir puede derivar en expulsión del clan y del Discord.
 
4️⃣ 🔹 **Construcciones y territorio**
- ❌ No grifear ni destruir construcciones ajenas.
- Preguntar antes de hacer construcciones en zonas del clan.
 
─────────────────────────────
 
⚖️ **SANCIONES**
1️⃣ Primera sanción: Mute de 1 hora.  
2️⃣ Segunda sanción: Mute de 5 horas.  
3️⃣ Tercera sanción: Mute de 12 horas.  
4️⃣ Cuarta sanción: Mute de 1 día.  
5️⃣ Quinta sanción: ⚠️ ÚLTIMA ADVERTENCIA – 5 días.  
6️⃣ Sexta sanción: ❌ Expulsión del clan y del Discord.  
 
*(Las sanciones pueden aplicarse según la gravedad de la falta.)*
 
─────────────────────────────
 
🏹 **LIDERAZGO DEL CLAN**
 
- <@&1459685194603823189> — <@777529808325181460>
- <@&1459688412356280623> — <@1042214255358910514>
- <@&1474178918549295156> — <@525815527117946892>
- <@&1466692938607099904> — <@1157178540865896580>
- <@&1478610757569744917> — <@670690283117084684>
- <@&1466694077104914576> — <@478093856668123148>
- <@&1466693381454434471> — <@722044088890818570>
 
─────────────────────────────
🔥🌅 ¡Que **ColmillosdelAlba** crezca fuerte, unido y legendario! 🌅🐉
`)
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
 
    // ===== LÓGICA COMANDO /SORTEO  =====
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
 
        // Temporizador para finalizar
        setTimeout(async () => {
            // Actualizar mensaje para obtener reacciones frescas
            const fetchedMessage = await mensajeSorteo.fetch();
            const reactions = fetchedMessage.reactions.cache.get("🎟️");
 
            if (!reactions || reactions.count <= 1) {
                return interaction.channel.send("😞 No hubo suficientes participantes para el sorteo.");
            }
 
            // Obtener usuarios participantes (excluyendo al bot)
            const users = await reactions.users.fetch();
            const participants = users.filter(u => !u.bot);
 
            if (participants.size === 0) {
                return interaction.channel.send("😞 No hubo participantes para el sorteo.");
            }
 
            // Seleccionar ganador al azar
            const winner = participants.random();
 
// Embed de Ganador
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
    }

    // ===== LÓGICA DE BOTONES (TICKETS Y ACCIONES) =====
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
                { id: "1480750004309332040", allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, 
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

        const embedFormulario = new EmbedBuilder()
            .setTitle("⚔ COLMILLOS DEL ALBA ⚔")
            .setDescription(`╔══════════════════════════════════╗\n      ⚔  COLMILLOS DEL ALBA  ⚔\n╚══════════════════════════════════╝\n\n**━━━  PROCESO DE RECLUTAMIENTO OFICIAL  ━━━**\n\nPulsa el botón **"📝 Responder Formulario"** para rellenar tu solicitud.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n      ⚔  FORJAMOS LEALTAD Y PODER  ⚔\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            .setColor(0x8B0000)
            .setImage("https://i.imgur.com/vpR9rSJ.png"); 

        const btnResponder = new ButtonBuilder().setCustomId("abrir_formulario").setLabel("📝 Responder Formulario").setStyle(ButtonStyle.Primary);
        const aceptar = new ButtonBuilder().setCustomId("aceptar_miembro").setLabel("Aceptar Miembro").setStyle(ButtonStyle.Success);
        const rechazar = new ButtonBuilder().setCustomId("rechazar_miembro").setLabel("Rechazar Miembro").setStyle(ButtonStyle.Danger);
        const cerrar = new ButtonBuilder().setCustomId("cerrar_ticket").setLabel("Cerrar Ticket").setStyle(ButtonStyle.Secondary);

        const fila = new ActionRowBuilder().addComponents(btnResponder, aceptar, rechazar, cerrar);
        await canal.send({ content: `<@&1480750004309332040> <@${interaction.user.id}>`, embeds: [embedFormulario], components: [fila] });
        await interaction.reply({ content: "✅ Ticket creado.", ephemeral: true });
    }

    if (interaction.customId === "abrir_formulario") {
        const modal = new ModalBuilder().setCustomId('modal_reclutamiento').setTitle('Formulario de Reclutamiento');

        const c1 = new TextInputBuilder().setCustomId('f_nick').setLabel("Nick en Minecraft").setStyle(TextInputStyle.Short).setRequired(true);
        const c2 = new TextInputBuilder().setCustomId('f_datos').setLabel("Edad / Sexo / País").setStyle(TextInputStyle.Short).setRequired(true);
        const c3 = new TextInputBuilder().setCustomId('f_especialidad').setLabel("Especialidad (PvP, Builder, etc)").setStyle(TextInputStyle.Short).setRequired(true);
        const c4 = new TextInputBuilder().setCustomId('f_exp').setLabel("Experiencia y Disponibilidad").setStyle(TextInputStyle.Paragraph).setRequired(true);
        const c5 = new TextInputBuilder().setCustomId('f_mic').setLabel("¿Tienes Micrófono?").setStyle(TextInputStyle.Short).setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(c1), new ActionRowBuilder().addComponents(c2), new ActionRowBuilder().addComponents(c3), new ActionRowBuilder().addComponents(c4), new ActionRowBuilder().addComponents(c5));
        await interaction.showModal(modal);
    }

    if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has("1480750004309332040")) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        
        const userId = interaction.channel.name.replace("verificacion-", "");
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });

        if (interaction.customId === "aceptar_miembro") {
            const rol = interaction.guild.roles.cache.get(CLAN_ROLE_ID);
            if (rol) await member.roles.add(rol);
            await interaction.reply({ embeds: [new EmbedBuilder().setTitle("✅ Aceptado").setDescription(`Bienvenido ${member.user.username} al clan.`).setColor(0x00FF00)] });
            await interaction.channel.setParent(CATEGORIA_HISTORIAL);
        } else {
            await interaction.reply({ embeds: [new EmbedBuilder().setTitle("❌ Rechazado").setDescription("El usuario será baneado en 15 segundos.").setColor(0xFF0000)] });
            setTimeout(async () => { await member.ban({ reason: "Rechazado en reclutamiento." }).catch(() => {}); }, 15000);
            await interaction.channel.setParent(CATEGORIA_HISTORIAL);
        }
    }

    if (interaction.customId === "cerrar_ticket") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has("1480750004309332040")) return interaction.reply({ content: "❌ Solo staff.", ephemeral: true });
        await interaction.channel.delete().catch(() => {});
    }
}); 

client.login(process.env.TOKEN);
