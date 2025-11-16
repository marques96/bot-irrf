const INSS_FAIXAS = [
    { limite: 1412.0, aliquota: 0.075 },
    { limite: 2666.68, aliquota: 0.09 },
    { limite: 4000.03, aliquota: 0.12 },
    { limite: 7786.02, aliquota: 0.14 },
];

const IRRF_FAIXAS = [
    { limite: 2259.2, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
    { limite: Infinity, aliquota: 0.275, deducao: 896.0 },
];

const DEDUCAO_DEPENDENTE = 189.59;
const FGTS_ALIQUOTA = 0.08;

function calcularINSS(salario) {
    let descontoTotal = 0;
    let baseAnterior = 0;

    for (const faixa of INSS_FAIXAS) {
        const baseCalculoFaixa = faixa.limite - baseAnterior;
        const valorNaFaixa = Math.min(salario - baseAnterior, baseCalculoFaixa);

        if (valorNaFaixa > 0) {
            descontoTotal += valorNaFaixa * faixa.aliquota;
        }

        if (salario <= faixa.limite) {
            break;
        }

        baseAnterior = faixa.limite;
    }

    return Number(Math.min(descontoTotal, 908.85).toFixed(2));
}
function calcularIRRF_Detalhado(salarioBruto, dependentes) {
    const inss = calcularINSS(salarioBruto);
    const deducaoDependentes = dependentes * DEDUCAO_DEPENDENTE;

    const baseCalculo = salarioBruto - inss - deducaoDependentes;

    const faixa = IRRF_FAIXAS.find((f) => baseCalculo <= f.limite);

    const impostoDevido =
        baseCalculo * faixa.aliquota - faixa.deducao;

    return {
        baseCalculo: Number(baseCalculo.toFixed(2)),
        deducaoINSS: inss,
        deducaoDependentes: Number(deducaoDependentes.toFixed(2)),
        impostoDevido: Math.max(0, Number(impostoDevido.toFixed(2))),
    };
}

function calcularFGTS(salario) {
    return Number((salario * FGTS_ALIQUOTA).toFixed(2));
}

module.exports = {
    calcularINSS,
    calcularIRRF_Detalhado,
    calcularFGTS,
    DEDUCAO_DEPENDENTE,
    FGTS_ALIQUOTA
};