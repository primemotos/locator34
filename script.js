document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // CONFIGURAÇÕES DO PROTÓTIPO
    // =========================================

    // Código aceito na demonstração
    const CODIGO_DEMO = "PRIME2026";


    // Primavera do Leste - MT
    const ORIGEM = [
        -15.5561,
        -54.2963
    ];


    // Cocalinho - MT
    const DESTINO = [
        -14.1237,
        -50.9983
    ];


    // =========================================
    // DURAÇÃO DA VIAGEM
    //
    // 8 HORAS
    // =========================================

    const DURACAO_SIMULACAO =
        8 *
        60 *
        60 *
        1000;


    // =========================================
    // VARIÁVEIS
    // =========================================

    let map = null;

    let routeCoordinates = [];

    let routeLine = null;

    let truckMarker = null;

    let animationFrame = null;

    let startTime = null;


    // =========================================
    // ELEMENTOS HTML
    // =========================================

    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const trackingScreen =
        document.getElementById(
            "tracking-screen"
        );


    const form =
        document.getElementById(
            "tracking-form"
        );


    const trackingCode =
        document.getElementById(
            "tracking-code"
        );


    const errorMessage =
        document.getElementById(
            "error-message"
        );


    const trackingButton =
        document.getElementById(
            "tracking-button"
        );


    const displayCode =
        document.getElementById(
            "display-code"
        );


    const newTracking =
        document.getElementById(
            "new-tracking"
        );


    const progressBar =
        document.getElementById(
            "progress-bar"
        );


    const progressText =
        document.getElementById(
            "progress-text"
        );


    const elapsed =
        document.getElementById(
            "elapsed"
        );


    const distance =
        document.getElementById(
            "distance"
        );


    const statusBadge =
        document.getElementById(
            "status-badge"
        );


    const lastUpdate =
        document.getElementById(
            "last-update"
        );


    // =========================================
    // FORMULÁRIO DE RASTREIO
    // =========================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const codigo =
                trackingCode
                    .value
                    .trim()
                    .toUpperCase();


            // Limpar erro

            errorMessage.textContent = "";


            // Campo vazio

            if (!codigo) {

                errorMessage.textContent =
                    "Digite o código de rastreio.";

                return;
            }


            // Código incorreto

            if (codigo !== CODIGO_DEMO) {

                errorMessage.textContent =
                    "Código de rastreio não encontrado.";

                trackingCode.focus();

                return;
            }


            // Botão carregando

            trackingButton.disabled =
                true;

            trackingButton.textContent =
                "Carregando rota...";


            try {

                await iniciarRastreamento(
                    codigo
                );


            } catch (erro) {

                console.error(erro);

                errorMessage.textContent =
                    "Não foi possível carregar a rota.";

                trackingButton.disabled =
                    false;

                trackingButton.textContent =
                    "Rastrear carga";

            }

        }
    );


    // =========================================
    // INICIAR RASTREAMENTO
    // =========================================

    async function iniciarRastreamento(
        codigo
    ) {

        // Mostrar código

        displayCode.textContent =
            codigo;


        // Esconder login

        loginScreen.classList.add(
            "hidden"
        );


        // Mostrar rastreamento

        trackingScreen.classList.remove(
            "hidden"
        );


        // Buscar rota

        await buscarRota();


        // Criar mapa

        criarMapa();


        // INICIAR VIAGEM AGORA

        startTime =
            performance.now();


        // Iniciar animação

        animarCaminhao(
            startTime
        );

    }


    // =========================================
    // BUSCAR ROTA
    // =========================================

    async function buscarRota() {

        /*
         * A rota é calculada utilizando OSRM.
         *
         * O caminhão será movimentado sobre os
         * pontos da rota retornada.
         */


        const start =
            `${ORIGEM[1]},${ORIGEM[0]}`;


        const end =
            `${DESTINO[1]},${DESTINO[0]}`;


        const url =
            "https://router.project-osrm.org/route/v1/driving/" +
            `${start};${end}` +
            "?overview=full&geometries=geojson";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Erro ao carregar rota."
            );

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            !data.routes.length
        ) {

            throw new Error(
                "Rota não encontrada."
            );

        }


        const rota =
            data.routes[0];


        // Converter longitude/latitude
        // para latitude/longitude

        routeCoordinates =
            rota.geometry.coordinates.map(
                function (coordinate) {

                    return [

                        coordinate[1],
                        coordinate[0]

                    ];

                }
            );


        // Distância da rota

        const distanciaKm =
            rota.distance / 1000;


        distance.textContent =
            `${distanciaKm.toFixed(0)} km`;

    }


    // =========================================
    // CRIAR MAPA
    // =========================================

    function criarMapa() {

        map =
            L.map(
                "map",
                {
                    zoomControl: true
                }
            );


        // =====================================
        // MAPA OPENSTREETMAP
        // =====================================

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        // =====================================
        // DESENHAR ROTA
        // =====================================

        routeLine =
            L.polyline(
                routeCoordinates,
                {

                    color: "#2563eb",

                    weight: 5,

                    opacity: 0.9

                }
            )
            .addTo(map);


        // Mostrar toda a rota

        map.fitBounds(
            routeLine.getBounds(),
            {
                padding: [
                    70,
                    70
                ]
            }
        );


        // =====================================
        // MARCADOR DE ORIGEM
        // =====================================

        L.circleMarker(
            ORIGEM,
            {

                radius: 8,

                color: "#ffffff",

                weight: 3,

                fillColor: "#22c55e",

                fillOpacity: 1

            }
        )
        .addTo(map)
        .bindPopup(
            "<strong>Saída</strong><br>" +
            "Primavera do Leste - MT"
        );


        // =====================================
        // MARCADOR DE DESTINO
        // =====================================

        L.circleMarker(
            DESTINO,
            {

                radius: 8,

                color: "#ffffff",

                weight: 3,

                fillColor: "#ef4444",

                fillOpacity: 1

            }
        )
        .addTo(map)
        .bindPopup(
            "<strong>Destino</strong><br>" +
            "Cocalinho - MT"
        );


        // =====================================
        // ÍCONE DO CAMINHÃO
        // =====================================

        const truckIcon =
            L.divIcon(
                {

                    className:
                        "truck-marker",

                    html:
                        "<div>🚛</div>",

                    iconSize:
                        [40, 40],

                    iconAnchor:
                        [20, 25]

                }
            );


        // =====================================
        // CRIAR CAMINHÃO
        // =====================================

        truckMarker =
            L.marker(
                ORIGEM,
                {

                    icon:
                        truckIcon,

                    zIndexOffset:
                        1000

                }
            )
            .addTo(map);

    }


    // =========================================
    // ANIMAÇÃO DO CAMINHÃO
    // =========================================

    function animarCaminhao(
        agora
    ) {

        // Tempo passado

        const tempoDecorrido =
            agora -
            startTime;


        // =====================================
        // PROGRESSO
        // =====================================

        const progresso =
            Math.min(
                tempoDecorrido /
                DURACAO_SIMULACAO,
                1
            );


        // =====================================
        // PEGAR POSIÇÃO NA ROTA
        // =====================================

        const posicao =
            calcularPosicao(
                progresso
            );


        // Mover caminhão

        if (
            truckMarker &&
            posicao
        ) {

            truckMarker.setLatLng(
                posicao
            );

        }


        // Atualizar painel

        atualizarInterface(
            progresso,
            tempoDecorrido
        );


        // =====================================
        // CONTINUAR ANIMAÇÃO
        // =====================================

        if (progresso < 1) {

            animationFrame =
                requestAnimationFrame(
                    animarCaminhao
                );

        } else {

            finalizarEntrega();

        }

    }


    // =========================================
    // CALCULAR POSIÇÃO
    // =========================================

    function calcularPosicao(
        progresso
    ) {

        if (
            routeCoordinates.length === 0
        ) {

            return null;

        }


        const totalPontos =
            routeCoordinates.length - 1;


        const posicaoAtual =
            progresso *
            totalPontos;


        const indice =
            Math.floor(
                posicaoAtual
            );


        const fracao =
            posicaoAtual -
            indice;


        // Se chegou no último ponto

        if (
            indice >= totalPontos
        ) {

            return
                routeCoordinates[
                    totalPontos
                ];

        }


        const pontoA =
            routeCoordinates[
                indice
            ];


        const pontoB =
            routeCoordinates[
                indice + 1
            ];


        // Interpolação para deixar
        // o movimento suave

        const latitude =
            pontoA[0] +
            (
                pontoB[0] -
                pontoA[0]
            ) *
            fracao;


        const longitude =
            pontoA[1] +
            (
                pontoB[1] -
                pontoA[1]
            ) *
            fracao;


        return [
            latitude,
            longitude
        ];

    }


    // =========================================
    // ATUALIZAR INTERFACE
    // =========================================

    function atualizarInterface(
        progresso,
        tempoDecorrido
    ) {

        const percentual =
            Math.floor(
                progresso * 100
            );


        // Barra

        progressBar.style.width =
            `${percentual}%`;


        // Texto

        progressText.textContent =
            `${percentual}%`;


        // Tempo

        elapsed.textContent =
            formatarTempo(
                tempoDecorrido
            );


        // Status

        lastUpdate.textContent =
            "Atualizando agora";

    }


    // =========================================
    // FORMATAR TEMPO
    // =========================================

    function formatarTempo(
        milissegundos
    ) {

        const segundosTotais =
            Math.floor(
                milissegundos /
                1000
            );


        const horas =
            Math.floor(
                segundosTotais /
                3600
            );


        const minutos =
            Math.floor(
                (
                    segundosTotais %
                    3600
                ) /
                60
            );


        const segundos =
            segundosTotais %
            60;


        const hh =
            String(horas)
                .padStart(2, "0");


        const mm =
            String(minutos)
                .padStart(2, "0");


        const ss =
            String(segundos)
                .padStart(2, "0");


        return `${hh}:${mm}:${ss}`;

    }


    // =========================================
    // FINALIZAR ENTREGA
    // =========================================

    function finalizarEntrega() {

        // Caminhão chega ao destino

        if (truckMarker) {

            truckMarker.setLatLng(
                DESTINO
            );

        }


        // Status

        statusBadge.textContent =
            "ENTREGUE";


        statusBadge.style.background =
            "#dbeafe";


        statusBadge.style.color =
            "#1d4ed8";


        // Progresso

        progressBar.style.width =
            "100%";


        progressText.textContent =
            "100%";


        // Atualização

        lastUpdate.textContent =
            "Entrega concluída";

    }


    // =========================================
    // NOVO RASTREIO
    // =========================================

    newTracking.addEventListener(
        "click",
        function () {

            // Parar animação

            if (animationFrame) {

                cancelAnimationFrame(
                    animationFrame
                );

            }


            // Remover mapa

            if (map) {

                map.remove();

                map = null;

            }


            // Limpar dados

            routeCoordinates = [];

            routeLine = null;

            truckMarker = null;

            startTime = null;


            // Voltar para login

            trackingScreen.classList.add(
                "hidden"
            );


            loginScreen.classList.remove(
                "hidden"
            );


            // Resetar formulário

            trackingCode.value = "";


            trackingButton.disabled =
                false;


            trackingButton.textContent =
                "Rastrear carga";


            errorMessage.textContent =
                "";


            // Resetar interface

            progressBar.style.width =
                "0%";


            progressText.textContent =
                "0%";


            elapsed.textContent =
                "00:00:00";


            statusBadge.textContent =
                "EM TRÂNSITO";


            statusBadge.style.background =
                "#dcfce7";


            statusBadge.style.color =
                "#15803d";


            trackingCode.focus();

        }
    );

});
