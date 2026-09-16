document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // CONFIGURAÇÕES DA VIAGEM
    // =====================================================

    // SAÍDA: Primavera do Leste - MT
    const ORIGEM = [-15.5561, -54.2963];

    // CHEGADA: Cocalinho - MT
    const DESTINO = [-14.1237, -50.9983];

    // Tempo total da viagem
    // 8 horas
    const DURACAO_VIAGEM = 8 * 60 * 60 * 1000;

    // Nova chave para não utilizar o progresso da viagem antiga
    const STORAGE_START_KEY = 'inicio_viagem_primavera_cocalinho';

    // Código de acesso
    const CODIGO_ACESSO = "39450";

    let map;
    let fullRoute = [];
    let retainedMarker;
    let polyline;


    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================

    document
        .getElementById('btn-login')
        ?.addEventListener('click', verificarCodigo);

    verificarSessaoSalva();


    // =====================================================
    // LOGIN
    // =====================================================

    function verificarCodigo() {

        const inputElement =
            document.getElementById('access-code');

        if (!inputElement) return;

        const code =
            inputElement.value.trim();

        if (code !== CODIGO_ACESSO) {

            alert(
                "Código de rastreio inválido. Tente novamente."
            );

            inputElement.value = "";

            localStorage.removeItem('codigoAtivo');

            return;
        }

        localStorage.setItem(
            'codigoAtivo',
            code
        );

        carregarInterface();
    }


    // =====================================================
    // VERIFICAR SESSÃO SALVA
    // =====================================================

    function verificarSessaoSalva() {

        const codigo =
            localStorage.getItem('codigoAtivo');

        if (codigo === CODIGO_ACESSO) {
            carregarInterface();
        }
    }


    // =====================================================
    // CARREGAR INTERFACE
    // =====================================================

    async function carregarInterface() {

        const overlay =
            document.getElementById('login-overlay');

        const btnLogin =
            document.getElementById('btn-login');

        if (btnLogin) {
            btnLogin.innerText = "Consultando...";
            btnLogin.disabled = true;
        }

        try {

            await buscarRotaNaAPI();

            if (overlay) {
                overlay.style.display = 'none';
            }

            const infoCard =
                document.getElementById('info-card');

            if (infoCard) {
                infoCard.style.display = 'flex';
            }

            // Atualiza informações do cartão
            atualizarInformacoes();

            // Inicia mapa
            iniciarMapa();

        } catch (erro) {

            console.error(
                "Erro ao carregar viagem:",
                erro
            );

            alert(
                "Não foi possível carregar a rota.\n\n" +
                "Verifique a conexão ou a configuração da API de rotas."
            );

            if (btnLogin) {
                btnLogin.innerText = "Consultar";
                btnLogin.disabled = false;
            }
        }
    }


    // =====================================================
    // ATUALIZAR INFORMAÇÕES DA VIAGEM
    // =====================================================

    function atualizarInformacoes() {

        /*
         * Caso seu HTML possua esses IDs,
         * eles serão atualizados automaticamente.
         */

        const origemElement =
            document.getElementById('origem');

        const destinoElement =
            document.getElementById('destino');

        const cidadeOrigemElement =
            document.getElementById('cidade-origem');

        const cidadeDestinoElement =
            document.getElementById('cidade-destino');

        if (origemElement) {
            origemElement.innerText =
                "PRIMAVERA DO LESTE";
        }

        if (destinoElement) {
            destinoElement.innerText =
                "COCALINHO";
        }

        if (cidadeOrigemElement) {
            cidadeOrigemElement.innerText =
                "PRIMAVERA DO LESTE - MT";
        }

        if (cidadeDestinoElement) {
            cidadeDestinoElement.innerText =
                "COCALINHO - MT";
        }
    }


    // =====================================================
    // BUSCAR ROTA
    // =====================================================

    async function buscarRotaNaAPI() {

        /*
         * IMPORTANTE:
         * Coloque sua chave do OpenRouteService abaixo.
         *
         * Não publique sua chave em repositório público.
         */

        const ORS_TOKEN =
            "COLOQUE_SUA_CHAVE_ORS_AQUI";


        const start =
            `${ORIGEM[1]},${ORIGEM[0]}`;

        const end =
            `${DESTINO[1]},${DESTINO[0]}`;


        const url =
            `https://api.openrouteservice.org/v2/directions/driving-car` +
            `?api_key=${ORS_TOKEN}` +
            `&start=${start}` +
            `&end=${end}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            const erro =
                await response.text();

            console.error(
                "Erro da OpenRouteService:",
                erro
            );

            throw new Error(
                "Erro ao consultar a rota."
            );
        }


        const data =
            await response.json();


        if (
            !data.features ||
            !data.features.length
        ) {

            throw new Error(
                "Nenhuma rota encontrada."
            );
        }


        fullRoute =
            data.features[0]
                .geometry
                .coordinates
                .map(c => [
                    c[1],
                    c[0]
                ]);


        console.log(
            "Rota carregada:",
            fullRoute.length,
            "pontos"
        );
    }


    // =====================================================
    // MAPA
    // =====================================================

    function iniciarMapa() {

        if (map) return;


        map = L.map(
            'map',
            {
                zoomControl: false
            }
        );


        // =================================================
        // OPENSTREETMAP
        // =================================================

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution:
                    '&copy; OpenStreetMap contributors'
            }
        ).addTo(map);


        // =================================================
        // DESENHAR ROTA
        // =================================================

        polyline =
            L.polyline(
                fullRoute,
                {
                    color: '#2563eb',
                    weight: 5,
                    dashArray: '10,10',
                    opacity: 0.8
                }
            ).addTo(map);


        // =================================================
        // ENQUADRAR A ROTA
        // =================================================

        if (fullRoute.length > 0) {

            map.fitBounds(
                polyline.getBounds(),
                {
                    padding: [60, 60]
                }
            );
        }


        // =================================================
        // ÍCONE DO CAMINHÃO
        // =================================================

        const truckStatusIcon =
            L.divIcon({

                className:
                    'custom-marker',

                html:
                    `<div style="
                        font-size:32px;
                        line-height:32px;
                    ">🚛</div>`,

                iconSize:
                    [40, 40],

                iconAnchor:
                    [20, 35]
            });


        // =================================================
        // POSIÇÃO INICIAL
        // =================================================

        retainedMarker =
            L.marker(
                ORIGEM,
                {
                    icon:
                        truckStatusIcon,

                    zIndexOffset:
                        1000
                }
            ).addTo(map);


        // =================================================
        // STATUS
        // =================================================

        atualizarStatus();


        // =================================================
        // INICIAR ANIMAÇÃO
        // =================================================

        animarCaminhao();
    }


    // =====================================================
    // ANIMAÇÃO DO CAMINHÃO
    // =====================================================

    function animarCaminhao() {

        let inicio =
            localStorage.getItem(
                STORAGE_START_KEY
            );


        // Se ainda não existe início,
        // cria agora.

        if (!inicio) {

            inicio =
                Date.now();

            localStorage.setItem(
                STORAGE_START_KEY,
                inicio
            );

        } else {

            inicio =
                parseInt(inicio);
        }


        function mover() {

            const agora =
                Date.now();


            const progresso =
                Math.min(
                    (agora - inicio) /
                    DURACAO_VIAGEM,
                    1
                );


            if (
                !fullRoute ||
                fullRoute.length === 0
            ) {

                requestAnimationFrame(mover);

                return;
            }


            // Índice correspondente ao progresso

            const index =
                Math.floor(
                    progresso *
                    (fullRoute.length - 1)
                );


            const posicao =
                fullRoute[index];


            // Mover caminhão

            if (
                retainedMarker &&
                posicao
            ) {

                retainedMarker.setLatLng(
                    posicao
                );
            }


            // Atualizar progresso
            atualizarProgresso(
                progresso
            );


            // Continuar até chegar

            if (progresso < 1) {

                requestAnimationFrame(
                    mover
                );

            } else {

                atualizarChegada();
            }
        }


        mover();
    }


    // =====================================================
    // STATUS
    // =====================================================

    function atualizarStatus() {

        const badge =
            document.getElementById(
                'time-badge'
            );


        if (badge) {

            badge.innerText =
                "EM TRÂNSITO";

            badge.style.background =
                "#22c55e";

            badge.style.color =
                "white";
        }
    }


    // =====================================================
    // PROGRESSO
    // =====================================================

    function atualizarProgresso(
        progresso
    ) {

        const percentual =
            Math.round(
                progresso * 100
            );


        const progressElement =
            document.getElementById(
                'progress'
            );


        if (progressElement) {

            progressElement.style.width =
                `${percentual}%`;
        }


        const percentElement =
            document.getElementById(
                'progress-percent'
            );


        if (percentElement) {

            percentElement.innerText =
                `${percentual}%`;
        }
    }


    // =====================================================
    // CHEGADA
    // =====================================================

    function atualizarChegada() {

        const badge =
            document.getElementById(
                'time-badge'
            );


        if (badge) {

            badge.innerText =
                "ENTREGUE";

            badge.style.background =
                "#2563eb";

            badge.style.color =
                "white";
        }
    }

});
