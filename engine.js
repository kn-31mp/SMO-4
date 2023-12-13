const HIGH_LOAD_FORM_TITLE = "highLoadFrom";
const HIGH_LOAD_CALCULATION_OUTPUT_ELEMENT_ID = "high_load_calculation_output";
const DUPLEX_CHANNEL_TYPE = "DUPLEX";
const SIMPLEX_CHANNEL_TYPE = "SIMPLEX";

function calculateHighLoadParams() {
    const highLoadForm = document.forms[HIGH_LOAD_FORM_TITLE];
    const highLoadParams = _retrieveHighLoadFormParams(highLoadForm);

    const parentElement = document.getElementById(HIGH_LOAD_CALCULATION_OUTPUT_ELEMENT_ID);
    parentElement.innerHTML = '';

    parentElement.innerHTML += '<div class="mb-3"><b>РЕЗУЛЬТАТИ ОБЧИСЛЕНЬ</b></div>';

    const rNuser = highLoadParams['userCount'];
    const rNquery = highLoadParams['requestCount'];
    const rLServ = highLoadParams['serverCount'];
    const rFreq = highLoadParams['processorFrequency'];
    const rNTactPerOper = highLoadParams['tactCountPerOperation'];
    const rNOperPerReq = highLoadParams['operationCountPerRequest'];
    const rRazmPacReq = highLoadParams['requestSize'];
    const rRazmPacAns = highLoadParams['responseSize'];
    const rChannelType = highLoadParams['channelType'];
    const rNumLine = highLoadParams['channelCount'];

    const ReceiveSpeed = highLoadParams['receiveSpeed'];
    const SendSpeed = highLoadParams['sendSpeed'];

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const aggregateChannelResult = _calculateAggregateChannelResult(highLoadParams);
    const channelReceiveSummaryHtml = _getAggregateChannelReceiveSummaryHtml(aggregateChannelResult);
    parentElement.innerHTML += channelReceiveSummaryHtml;

    let Lamda = (rNuser*rNquery)/60; //интенсивность поступления заявок от пользователя [1/сек]
    let TrecvQuery = rRazmPacReq/(ReceiveSpeed*rNumLine); //Время на получение одной заявки
    let MuRecv = 1/TrecvQuery; //интенсивность приема
    let RoRecv = Lamda/(MuRecv); //Загруженность канала приема
    let UispRecv = Math.min(RoRecv*rNumLine,rNumLine)/rNumLine; //Коэффициэнт использования канала
    let NsrRecv = UispRecv/(1-UispRecv); //Средняя длина очереди
    let TNRecv = TrecvQuery*NsrRecv*rNumLine; //считаем что одна заявка передается только по 1 каналу

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    let DeltaTRecv = 60/(rNuser*rNquery); //Среднее время между поступлениями заявок от пользователя[сек]
    let DeltaTServ = Math.max(TrecvQuery,DeltaTRecv); //Время между поступлениями заявок на сервер
    let LamdaServ = 1/DeltaTServ; //Интенсивность поступления заявок на сервер
    let Ttact = 1/(rFreq*1000000); //время одного такта в сек
    let Ts = rNTactPerOper*rNOperPerReq*Ttact; //Вpемя обслуживания заявки процессором [сек]
    let Mu = 1/Ts; //Интенсивность обслуживания заявок сервером
    let RoServ = LamdaServ/(Mu*rLServ); //Вероятность загрузки сервера

    let serverSummaryHtml = "";
    serverSummaryHtml += "<ul>";
    serverSummaryHtml += `<li>Інтенсивність обробки заявок сервером (заявок/сек): ${Mu}</li>`;
    serverSummaryHtml += `<li>Імовірність завантаження обслуговуючого пристрою (сервера): ${RoServ}</li>`;
    serverSummaryHtml += `<li>Середній час обслуговування заявки сервером (с): ${Ts}</li>`;

    let Pzagr = rLServ*RoServ; 
    let K1 = 0.0;
    let Fact1 = 0.0;
    for (let i=0; i<rLServ; i++) {
        Fact1 = Math.max(Fact1, 1) * Math.max(i, 1);
        K1=K1+(Math.pow(Pzagr,i))/Fact1;
    }

    let K2 = 0.0;
    let Fact2 = 0.0;
    for (let i=0; i<=rLServ; i++) {
        Fact2=Math.max(Fact2, 1) * Math.max(i, 1);
        K2=K2+(Math.pow(Pzagr,i))/Fact2;
    }

    let K = K1/K2;
    //parentElement.innerHTML += ("<li><p></p>K1:   " +K1 );
    //parentElement.innerHTML += ("<li><p></p>K2:   " +K2 );
    //parentElement.innerHTML += ("<li><p></p>K:   " +K );
    
    let C = (1-K)/(1-RoServ*K); //Быстродействие системы ???
    //parentElement.innerHTML += ("<li><p></p>C:   " +C);
    
    let w = C*RoServ/(1-RoServ); //Количество заявок в очереди
    //parentElement.innerHTML += ("<li><p></p>w:   " +w );
    let q = w+rLServ*RoServ;  //Количество заявок в системе сервера
    //parentElement.innerHTML += ("<li><p></p>q:   " +q );
    let Tw = (C/rLServ)*Ts/(1-RoServ); //Среднее время ожидания в очереди
    //parentElement.innerHTML += ("<li><p></p>Tw:   " +Tw );
    let Tq = Tw+Ts; //Среднее время нахождения на сервере
    //parentElement.innerHTML += ("<li><p></p>Tq:   " +Tq );
    let GTq = Ts/(rLServ*(1-RoServ))*(Math.sqrt(C*(2-C)+rLServ*rLServ*(1-RoServ)*(1-RoServ))); //отклонение времени нахождения заявки в системе
    // parentElement.innerHTML += ("<li><p></p>GTq:   " +GTq );
    let Gw = (1/(1-RoServ))*(Math.sqrt(C*RoServ*(1+RoServ-C*RoServ))); //отклонение количества элементов данных в очереди
    // parentElement.innerHTML += ("<li><p></p>Gw:   " +Gw);
    if (RoServ>=1) {
        serverSummaryHtml += "<li>Сервер(и) перевантажений(і)</li>";
    } else {
        serverSummaryHtml += `<li>Середній час, який заявки повинні очікувати в черзі сервера Tw (с): ${Tw}</li>`;
        serverSummaryHtml += `<li>Середній час, який заявки перебувають у сервері взагалі (с) Tq: ${Tq}</li>`;
        serverSummaryHtml += `<li>Середня довжина черги в сервер w: ${w}</li>`;
        serverSummaryHtml += `<li>Середня кількість елементів даних у сервері q: ${q}</li>`;
        serverSummaryHtml += `<li>Стандартне відхилення середнього часу перебування заявки в сервері (с) GTq: ${GTq}</li>`;
        serverSummaryHtml += `<li>Стандартне відхилення кількості елементів даних у черзі Gw: ${Gw}</li>`;
        if (RoServ<0.5) {
            serverSummaryHtml += `<li>Неефективне використання сервера(ів)</li>`;
        } else {
            serverSummaryHtml += `<li>Навантаження на сервер(и) нормальне</li>`;
        }
    }
    serverSummaryHtml += "</ul><hr />";
    parentElement.innerHTML += serverSummaryHtml;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

    let DeltaTSend = Math.max(DeltaTServ,Ts); //Среднее время между поступлениями заявок от сервера[сек]
    let LamdaSend = 1/DeltaTSend; //интенсивность поступления заявок от сервера [1/сек]
    let TSendQuery = rRazmPacAns/(SendSpeed*rNumLine); //Время на отправление одной заявки
    let MuSend = 1/TSendQuery; //интенсивность передачи
    let uSend = 1/(rRazmPacAns/SendSpeed/rNumLine);
    let pSend = (rRazmPacAns / ReceiveSpeed) * Lamda / rNumLine;
    let UispSend = Math.min(pSend,1); //Коэффициэнт использования агрегированного канала

    let channelSendSummaryHtml = "";
    channelSendSummaryHtml += "<ul>"
    channelSendSummaryHtml += `<li>Інтенсивність надходження заявок від сервера (заявок/сек): ${LamdaSend}</li>`;
    channelSendSummaryHtml += `<li>Час передавання однієї заявки (сек): ${TSendQuery}</li>`;
    channelSendSummaryHtml += `<li>Завантаженість агрегованого каналу передачі: ${pSend}</li>`;
    channelSendSummaryHtml += `<li>Коефіцієнт використання агрегованого каналу передачі: ${UispSend}</li>`;
    channelSendSummaryHtml += `<li>Інтенсивність трафіку передавання: ${uSend}</li>`;
    
    if (UispSend>=1) {
        channelSendSummaryHtml += "<li>Канал(и) передачі перевантажений(і)</li>";
    } else {
        let NsrSend=UispSend/(1-UispSend); //Средняя длина очереди
        TNSend=TSendQuery*NsrSend*rNumLine;
        channelSendSummaryHtml += `<li>Середня довжина черги: ${NsrSend}</li>`;

        if (UispSend<0.5) {
            channelSendSummaryHtml += "<li>Неефективне використання канал(ів) передачі</li>";
        } else {
            channelSendSummaryHtml += "<li>Навантаження на канал(и) передачі нормальне</li>";
        }
    }
    channelSendSummaryHtml += "</ul><hr />";
    parentElement.innerHTML += channelSendSummaryHtml;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    let summaryHtml = "<ul>";
    if ((UispSend>=1)||(RoServ>=1)||(UispRecv>=1)) {
        summaryHtml += " \
            <li>Користувач чекатиме відповіді з кожним запитом \
			дедалі довше, оскільки СМО не справляється з таким \
			потоком даних. Черга запитів зростатиме доти, \
			доки не переповниться буфер. Після чого запити \
			взагалі почнуть губитися. Необхідно змінити параметри \
			системи, щоб вона впоралася з навантаженням. \
			Інакше система дуже швидко не всі користувачі \
			отримають відповіді через перевантаження СМО.</li> \
        ";
    } else {
        let Tuser_wait = TrecvQuery+TNRecv+Tq+TSendQuery+TNSend;
        summaryHtml += `<li>Час, який користувач чекає на відповідь: ${Tuser_wait}</li>`;
        let Tuser_waitMin = TrecvQuery+Ts+TSendQuery;
        summaryHtml += `<li>Мінімальний час, за який користувач отримує відповідь (без черги): ${Tuser_waitMin}</li>`;
    }

    summaryHtml += `<li>Середня швидкість прийому: ${ReceiveSpeed * UispRecv}</li>`;
    summaryHtml += `<li>Середня швидкість передачі: ${SendSpeed * UispSend}</li>`;
    if (rChannelType == SIMPLEX_CHANNEL_TYPE) {
        summaryHtml += `<li>Максимальна швидкість приймання: ${ReceiveSpeed}</li>`;
        summaryHtml += `<li>Максимальна швидкість передачі: ${SendSpeed}</li>`;
    }
    summaryHtml += "</ul>";

    parentElement.innerHTML += summaryHtml;
}

function _retrieveHighLoadFormParams(highLoadSystemForm) {
    let highLoadParams = {}

    highLoadParams['userCount'] = highLoadSystemForm['userCount'].value;
    highLoadParams['requestCount'] = highLoadSystemForm['requestCount'].value;
    highLoadParams['serverCount'] = highLoadSystemForm['serverCount'].value;
    highLoadParams['processorFrequency'] = highLoadSystemForm['processorFrequency'].value;
    highLoadParams['channelSpeed'] = highLoadSystemForm['channelSpeed'].value;
    highLoadParams['tactCountPerOperation'] = highLoadSystemForm['tactCountPerOperation'].value;
    highLoadParams['operationCountPerRequest'] = highLoadSystemForm['operationCountPerRequest'].value;
    highLoadParams['requestSize'] = highLoadSystemForm['requestSize'].value;
    highLoadParams['responseSize'] = highLoadSystemForm['responseSize'].value;
    highLoadParams['channelType'] = highLoadSystemForm['channelType'].value;
    highLoadParams['channelCount'] = highLoadSystemForm['channelCount'].value;

    const receiveSpeed = _calculateReceiveSpeed(highLoadParams);
    highLoadParams['receiveSpeed'] = receiveSpeed;

    const sendSpeed = _calculateSendSpeed(highLoadParams);
    highLoadParams['sendSpeed'] = sendSpeed;

    return highLoadParams
}

function _calculateReceiveSpeed(highLoadParams) {
    const channelSpeed = highLoadParams['channelSpeed'];
    const requestSize = highLoadParams['requestSize'];
    const responseSize = highLoadParams['responseSize'];
    const channelType = highLoadParams['channelType'];

    let receiveSpeed = '';
    if (channelType == DUPLEX_CHANNEL_TYPE) {
        receiveSpeed = channelSpeed;
    } else if (channelType == SIMPLEX_CHANNEL_TYPE) {
        receiveSpeed = channelSpeed * requestSize / (requestSize + responseSize);
    }

    return receiveSpeed;
}

function _calculateSendSpeed(highLoadParams) {
    const channelSpeed = highLoadParams['channelSpeed'];
    const responseSize = highLoadParams['responseSize'];
    const requestSize = highLoadParams['requestSize'];
    const channelType = highLoadParams['channelType'];

    let sendSpeed = '';
    if (channelType == DUPLEX_CHANNEL_TYPE) {
        sendSpeed = channelSpeed;
    } else if (channelType == SIMPLEX_CHANNEL_TYPE) {
        sendSpeed = channelSpeed * responseSize / (requestSize + responseSize);
    }

    return sendSpeed;
}

function _calculateAggregateChannelResult(highLoadParams) {
    const userCount = highLoadParams['userCount'];
    const requestCount = highLoadParams['requestCount'];
    const requestSize = highLoadParams['requestSize'];
    const receiveSpeed = highLoadParams['receiveSpeed'];
    const channelCount = highLoadParams['channelCount'];

    let lambda = (userCount * requestCount) / 60;
    let timeToReceiveRequest = requestSize / (receiveSpeed * channelCount);
    let receiveIntensity = 1 / timeToReceiveRequest;
    let channelLoad = lambda / (receiveIntensity);
    let coefficientOfChannelUsage = Math.min(channelLoad * channelCount, channelCount) / channelCount;
    let averageQueueSize = coefficientOfChannelUsage / (1 - coefficientOfChannelUsage);

    const aggregateChannelResult = {};
    aggregateChannelResult['lambda'] = lambda;
    aggregateChannelResult['timeToReceiveRequest'] = timeToReceiveRequest;
    aggregateChannelResult['receiveIntensity'] = receiveIntensity;
    aggregateChannelResult['channelLoad'] = channelLoad;
    aggregateChannelResult['coefficientOfChannelUsage'] = coefficientOfChannelUsage;
    aggregateChannelResult['averageQueueSize'] = averageQueueSize;

    return aggregateChannelResult;
}

function _getAggregateChannelReceiveSummaryHtml(aggregateChannelResult) {
    let channelReceiveSummaryHtml = "";

    channelReceiveSummaryHtml += "<div><ul>";

    const lambda = aggregateChannelResult['lambda'];
    channelReceiveSummaryHtml += `<li>Інтенсивність надходження заявок від користувачів (заявок/сек): ${lambda}</li>`;

    const timeToReceiveRequest = aggregateChannelResult['timeToReceiveRequest'];
    channelReceiveSummaryHtml += `<li>Час отримання однієї заявки (сек): ${timeToReceiveRequest}</li>`;

    const channelLoad = aggregateChannelResult['channelLoad'];
    channelReceiveSummaryHtml += `<li>Завантаженість агрегованого каналу прийому (норма <1): ${channelLoad}</li>`;

    const coefficientOfChannelUsage = aggregateChannelResult['coefficientOfChannelUsage'];
    channelReceiveSummaryHtml += `<li>Коефіцієнт використання агрегованого каналу прийому: ${coefficientOfChannelUsage}</li>`;

    if (coefficientOfChannelUsage >= 1) {
        channelReceiveSummaryHtml += "<li>Канал(и) прийому перевантажений(і)</li>";
    } else {
        const averageQueueSize = aggregateChannelResult['averageQueueSize'];
        channelReceiveSummaryHtml += `<li>Середня довжина черги: ${averageQueueSize}</li>`;

        if (coefficientOfChannelUsage<0.5) {
            channelReceiveSummaryHtml += "<li>Неефективне використання канал(ів) прийому</li>";
        } else {
            channelReceiveSummaryHtml += "<li>Навантаження на канал(и) прийому нормальне</li>";
        };
    };

    channelReceiveSummaryHtml += "</ul></div><hr />";

    return channelReceiveSummaryHtml;
}
