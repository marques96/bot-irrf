const logger = require("./logger");
require("dotenv").config();
const { Telegraf } = require("telegraf");

const {
    calcularINSS,
    calcularIRRF_Detalhado,
    calcularFGTS,
    DEDUCAO_DEPENDENTE,
    FGTS_ALIQUOTA
} = require("./calculos");


logger.info("Carregando BOT_TOKEN...");
const token = process.env.BOT_TOKEN;

if (!token) {
    logger.error("ERRO: BOT_TOKEN não encontrado no .env. Configure a variável.");
    process.exit(1);
}

const bot = new Telegraf(token);
logger.info("Inicialização do bot Telegraf concluída.");


function gerarRelatorioHTML(salario, dependentes) {
    const inss = calcularINSS(salario);
    const fgts = calcularFGTS(salario);
    const irrf = calcularIRRF_Detalhado(salario, dependentes);

    const salarioLiquido = Number(
        (salario - inss - irrf.impostoDevido).toFixed(2)
    );

    return `<b>📊 Relatório de Cálculo CLT</b>

<b>💰 Salário Bruto:</b> R$ ${salario.toFixed(2)}
<b>👨‍👩‍👧 Dependentes:</b> ${dependentes}

<b>🏢 Encargos da Empresa</b>
• FGTS (${(FGTS_ALIQUOTA * 100).toFixed(0)}%): <b>R$ ${fgts.toFixed(2)}</b>
<i>(Pago pela empresa — não descontado do funcionário)</i>

<b>💸 Descontos do Salário</b>
• INSS (progressivo): <b>R$ ${inss.toFixed(2)}</b>
• IRRF: <b>R$ ${irrf.impostoDevido.toFixed(2)}</b>

<b>🧮 Detalhamento do IRRF</b>
• Base de cálculo: <code>R$ ${irrf.baseCalculo.toFixed(2)}</code>  
• Dedução por INSS: <code>R$ ${inss.toFixed(2)}</code>  
• Dedução por dependentes: <code>R$ ${irrf.deducaoDependentes.toFixed(2)}</code>

<b>🏁 Resultado Final</b>
<b>✅ Salário Líquido:</b> <b>R$ ${salarioLiquido.toFixed(2)}</b>

<i>Valores com base nas tabelas oficiais de 2024.</i>`;
}


bot.start((ctx) => {
    const mensagem = `👋 Olá, <b>${ctx.from.first_name}</b>!

Eu sou seu assistente para cálculo de salário CLT.

📊 <b>Como usar:</b>
Use o comando:
<code>/irrf &lt;salário&gt; &lt;dependentes&gt;</code>

💡 <b>Exemplo:</b>
<code>/irrf 5000 2</code>
<i>(Para salário de R$ 5.000,00 e 2 dependentes)</i>

⚠️ <b>Atenção:</b> Use ponto para decimais, ex:
<code>3500.50</code>

🛑 Use <code>/sair</code> para desligar o bot (se você for o administrador).
    `;
    ctx.replyWithHTML(mensagem.trim());
});

bot.command("irrf", (ctx) => {
    const [, salarioStr, dependentesStr] = ctx.message.text.split(" ");

    if (!salarioStr || !dependentesStr) {
        return ctx.replyWithHTML(`<b>🚫 Formato incorreto!</b>

Use:
<code>/irrf &lt;salário&gt; &lt;dependentes&gt;</code>

Exemplo:
<code>/irrf 5000 2</code>
        `);
    }

    if (salarioStr.includes(',')) {
        return ctx.replyWithHTML(`⚠️ <b>Vírgula (,) detectada!</b>

Por favor, use o <b>ponto final (.)</b> como separador decimal.

Exemplo correto:
<code>/irrf 3500.90 2</code>
        `);
    }

    const salario = parseFloat(salarioStr);
    const dependentes = parseInt(dependentesStr);

    if (isNaN(salario) || salario <= 0 || isNaN(dependentes) || dependentes < 0) {
        return ctx.replyWithHTML(`⚠️ <b>Valores inválidos!</b>
Envie números válidos e positivos.
Exemplo:
<code>/irrf 9050.53 2</code>
        `);
    }

    const relatorio = gerarRelatorioHTML(salario, dependentes);
    ctx.replyWithHTML(relatorio);
});

bot.command("sair", (ctx) => {
    const userId = ctx.from.id;
    

    ctx.reply("👋 Desligando o bot. Até logo!").then(() => {
        logger.info(`🤖 Bot encerrado pelo usuário ID: ${userId}`);
        bot.stop();
        process.exit(0);
    });
});


bot.on('text', (ctx) => {
    if (ctx.message.text.startsWith('/')) {
        return ctx.replyWithHTML(`❌ <b>Comando desconhecido!</b>

Por favor, escolha uma das opções válidas:
- <code>/start</code>: Para ver a introdução e o modo de uso.
- <code>/irrf &lt;salário&gt; &lt;dependentes&gt;</code>: Para realizar um cálculo.
        `);
    }
});

bot.launch()
    .then(() => {
        logger.info("🤖 Bot de Cálculo CLT Iniciado e escutando.");
    })
    .catch((err) => {
        logger.error("❌ Falha ao iniciar o Bot:", err);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));