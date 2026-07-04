// ESTADO INTERNO DA APLICAÇÃO (MÁQUINA DE ESTADOS)
const appState = {
    priority: null,
    service: null,
    currentScreen: 'priority' // 'priority', 'service', 'success'
};

// RELÓGIO EM TEMPO REAL
function startRealTimeClock() {
    function tick() {
        const now = new Date();

        // Formatação da Hora
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            clockElement.textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
        }

        // Formatação da Data por extenso
        const dateElement = document.getElementById('date');
        if (dateElement) {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            dateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }
    setInterval(tick, 1000);
    tick();
}

// CONTROLADOR DE ATUALIZAÇÃO DE TELAS (STATE ROUTER)
function updateScreenView() {
    const screenPriority = document.getElementById('screen-priority');
    const screenService = document.getElementById('screen-service');
    const screenSuccess = document.getElementById('screen-success');

    // Proteção caso os elementos de tela fundamentais não existam no DOM
    if (!screenPriority || !screenService || !screenSuccess) return;

    // Esconde todas as seções
    screenPriority.classList.add('hidden');
    screenService.classList.add('hidden');
    screenSuccess.classList.add('hidden');

    if (appState.currentScreen === 'priority') {
        screenPriority.classList.remove('hidden');
    }
    else if (appState.currentScreen === 'service') {
        const priorityBadge = document.getElementById('priority-badge');

        if (priorityBadge) {
            priorityBadge.textContent = `Atendimento ${appState.priority}`;
            priorityBadge.className = 'screen-badge'; // Reset classe

            // Estilização dinâmica da badge de acordo com a prioridade selecionada
            if (appState.priority === 'Preferencial') {
                priorityBadge.classList.add('badge-amber');
            } else if (appState.priority === 'Imediato') {
                priorityBadge.classList.add('badge-rose');
            } else {
                priorityBadge.classList.add('badge-cyan');
            }
        }

        screenService.classList.remove('hidden');
    }
    else if (appState.currentScreen === 'success') {
        // Preenche dados do cupom impresso simulado com verificações de segurança
        const ticketPriority = document.getElementById('ticket-priority');
        const ticketService = document.getElementById('ticket-service');
        const ticketNumber = document.getElementById('ticket-number');
        const ticketTime = document.getElementById('ticket-time');

        if (ticketPriority) ticketPriority.textContent = appState.priority;
        if (ticketService) ticketService.textContent = appState.service;

        // Emite um código sequencial representativo com prefixo
        const sequenceNum = Math.floor(Math.random() * 899) + 100;
        let prefixCode = 'N'; // Normal
        if (appState.priority === 'Preferencial') prefixCode = 'P';
        if (appState.priority === 'Imediato') prefixCode = 'I';

        if (ticketNumber) ticketNumber.textContent = `${prefixCode}-${sequenceNum}`;

        // Adiciona data e hora da impressão no cupom
        const printDate = new Date();
        if (ticketTime) ticketTime.textContent = printDate.toLocaleString('pt-BR');

        screenSuccess.classList.remove('hidden');
    }
}

// EVENTOS DE NAVEGAÇÃO DOS PASSOS
function selectPriority(selectedPriority) {
    appState.priority = selectedPriority;
    appState.currentScreen = 'service';
    updateScreenView();
}

// Modais protegidos contra erros caso os IDs não batam com o HTML
function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (modal) {
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
}

function selectService(selectedService) {
    appState.service = selectedService;
    appState.currentScreen = 'success';
    updateScreenView();
}

function goBack() {
    if (appState.currentScreen === 'service') {
        appState.priority = null;
        appState.currentScreen = 'priority';
    }
    updateScreenView();
}

function resetFlow() {
    appState.priority = null;
    appState.service = null;
    appState.currentScreen = 'priority';
    updateScreenView();
}

// ==================== OPERAÇÕES DE POP-UPS / MODAIS ====================

function openInfoModal() {
    toggleModal('modal-info', true);
    fetchPatoBrancoWeather();
}
function closeInfoModal() {
    toggleModal('modal-info', false);
}

function openFeedbackModal() {
    toggleModal('modal-feedback', true);
}
function closeFeedbackModal() {
    toggleModal('modal-feedback', false);
}

function openLgpdModal() {
    toggleModal('modal-lgpd', true);
}
function closeLgpdModal() {
    toggleModal('modal-lgpd', false);
}

// PROCESSAMENTO DE FEEDBACK (SUBMIT)
function submitFeedback(reaction, emoji) {
    closeFeedbackModal();

    const messageElement = document.getElementById('thanks-message');
    if (messageElement) {
        messageElement.innerHTML = `Sua avaliação foi registrada como <strong style="color: var(--cyan-primary);">${reaction} ${emoji}</strong>.<br>Agradecemos sinceramente a contribuição para a melhoria do Posto de Saúde de Pato Branco!`;
    }

    toggleModal('modal-thanks', true);

    // Fechamento automático sem travar o totem
    setTimeout(() => {
        toggleModal('modal-thanks', false);
    }, 4000);
}

// CLIENT METEOROLÓGICO REAL DE PATO BRANCO (wttr.in JSON API)
async function fetchPatoBrancoWeather() {
    const currentTempLabel = document.getElementById('current-temp');
    const modalTempLabel = document.getElementById('weather-temp-modal');
    const weatherDescLabel = document.getElementById('weather-description');

    const weatherIconModal = document.getElementById('weather-icon-modal');
    const weatherIconContainer = document.getElementById('weather-icon-container');

    try {
        const response = await fetch('https://wttr.in/Pato_Branco?format=j1');
        if (!response.ok) throw new Error('Serviço de clima indisponível');
        const data = await response.json();

        const current = data.current_condition[0];
        const tempC = current.temp_C;
        const description = current.lang_pt ? current.lang_pt[0].value : current.weatherDesc[0].value;

        // Vincula aos componentes da UI se eles existirem na tela
        if (currentTempLabel) currentTempLabel.textContent = `${tempC}°C`;
        if (modalTempLabel) modalTempLabel.textContent = `${tempC}°C`;
        if (weatherDescLabel) weatherDescLabel.textContent = description.charAt(0).toUpperCase() + description.slice(1);

        // Determinação de ícones baseado em retorno wttr (Garante fallback para String/Number)
        const code = String(current.weatherCode || "");
        let iconMarkup = '<i class="fa-solid fa-cloud-sun"></i>';

        if (code === "113") {
            iconMarkup = '<i class="fa-solid fa-sun" style="color: var(--amber-primary);"></i>';
        } else if (code === "116") {
            iconMarkup = '<i class="fa-solid fa-cloud-sun"></i>';
        } else if (parseInt(code, 10) >= 293) {
            iconMarkup = '<i class="fa-solid fa-cloud-showers-heavy" style="color: #3b82f6;"></i>';
        } else {
            iconMarkup = '<i class="fa-solid fa-cloud" style="color: var(--text-muted);"></i>';
        }

        if (weatherIconModal) weatherIconModal.innerHTML = iconMarkup;
        if (weatherIconContainer) weatherIconContainer.innerHTML = iconMarkup;

    } catch (error) {
        console.warn('Conectividade meteorológica não estabelecida. Ativando estimativa local...', error);

        // FALLBACK ESTACIONAL (Garante exibição mesmo sem internet no totem)
        const month = new Date().getMonth();
        let mockTemp = "23°C";
        let mockDesc = "Céu Limpo";
        let iconMarkup = '<i class="fa-solid fa-sun" style="color: var(--amber-primary);"></i>';

        if (month >= 5 && month <= 8) { // Meses frios no Paraná
            mockTemp = "14°C";
            mockDesc = "Sensação amena e nublado";
            iconMarkup = '<i class="fa-solid fa-cloud-sun"></i>';
        }

        if (currentTempLabel) currentTempLabel.textContent = mockTemp;
        if (modalTempLabel) modalTempLabel.textContent = mockTemp;
        if (weatherDescLabel) weatherDescLabel.textContent = `${mockDesc} (Estimativa Estacional)`;
        if (weatherIconModal) weatherIconModal.innerHTML = iconMarkup;
        if (weatherIconContainer) weatherIconContainer.innerHTML = iconMarkup;
    }
}

// INICIALIZAÇÃO DO SISTEMA
window.onload = function () {
    startRealTimeClock();
    fetchPatoBrancoWeather();
};