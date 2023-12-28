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

    const aggregateChannelReceiveResult = _calculateAggregateChannelReceiveResult(highLoadParams);
    const channelReceiveSummaryHtml = _getAggregateChannelReceiveSummaryHtml(aggregateChannelReceiveResult);
    parentElement.innerHTML += channelReceiveSummaryHtml;

    const serverOverloadProbabilityResult = _calculateServerOverloadProbabilityResult(highLoadParams);
    const serverOverloadProbabilitySummaryHtml = _getServerOverloadProbabilitySummaryHtml(serverOverloadProbabilityResult);
    parentElement.innerHTML += serverOverloadProbabilitySummaryHtml;

    const aggregateChannelSendResult = _calculateAggregateChannelSendResult(highLoadParams);
    const aggregateChannelSendSummaryHtml = _getAggregateChannelSendSummaryHtml(aggregateChannelSendResult);
    parentElement.innerHTML += aggregateChannelSendSummaryHtml;

    const generalResult = _calculateGeneralResult(highLoadParams);
    const generalSummaryHtml = _getGeneralSummaryHtml(generalResult);
    parentElement.innerHTML += generalSummaryHtml;
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

    let receiveSpeed = 0;
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

function _calculateAggregateChannelReceiveResult(highLoadParams) {
    const userCount = highLoadParams['userCount'];
    const requestCount = highLoadParams['requestCount'];
    const requestSize = highLoadParams['requestSize'];
    const receiveSpeed = highLoadParams['receiveSpeed'];
    const channelCount = highLoadParams['channelCount'];

    // Інтенсивність надходження заявок від користувачів (заявок/сек)
    const lambda = (userCount * requestCount) / 60;

    // Час отримання однієї заявки (сек)
    const timeToReceiveRequest = requestSize / (receiveSpeed * channelCount);

    // Інтенсивність надходження заявок на сервер
    const receiveIntensity = 1 / timeToReceiveRequest;

    // Завантаженість агрегованого каналу прийому (норма <1)
    const channelLoad = lambda / receiveIntensity;

    // Коефіцієнт використання агрегованого каналу прийому
    const coefficientOfChannelUsage = Math.min(channelLoad * channelCount, channelCount) / channelCount;

    // Середня довжина черги
    const averageQueueLength = coefficientOfChannelUsage / (1 - coefficientOfChannelUsage);

    // ???
    const tNReceive = timeToReceiveRequest * averageQueueLength * channelCount;

    const result = {};
    result['lambda'] = lambda;
    result['timeToReceiveRequest'] = timeToReceiveRequest;
    result['receiveIntensity'] = receiveIntensity;
    result['channelLoad'] = channelLoad;
    result['coefficientOfChannelUsage'] = coefficientOfChannelUsage;
    result['averageQueueLength'] = averageQueueLength;
    result['tNReceive'] = tNReceive;

    return result;
}

function _getAggregateChannelReceiveSummaryHtml(aggregateChannelReceiveResult) {
    let summaryHtml = "";

    summaryHtml += "<div><ul>";

    const lambda = aggregateChannelReceiveResult['lambda'];
    summaryHtml += `<li>Інтенсивність надходження заявок від користувачів (заявок/сек): ${lambda}</li>`;

    const timeToReceiveRequest = aggregateChannelReceiveResult['timeToReceiveRequest'];
    summaryHtml += `<li>Час отримання однієї заявки (сек): ${timeToReceiveRequest}</li>`;

    const channelLoad = aggregateChannelReceiveResult['channelLoad'];
    summaryHtml += `<li>Завантаженість агрегованого каналу прийому (норма <1): ${channelLoad}</li>`;

    const coefficientOfChannelUsage = aggregateChannelReceiveResult['coefficientOfChannelUsage'];
    summaryHtml += `<li>Коефіцієнт використання агрегованого каналу прийому: ${coefficientOfChannelUsage}</li>`;

    if (coefficientOfChannelUsage >= 1) {
        summaryHtml += "<li>Канал(и) прийому перевантажений(і)</li>";
    } else {
        const averageQueueLength = aggregateChannelReceiveResult['averageQueueLength'];
        summaryHtml += `<li>Середня довжина черги: ${averageQueueLength}</li>`;

        if (coefficientOfChannelUsage < 0.5) {
            summaryHtml += "<li>Неефективне використання канал(ів) прийому</li>";
        } else {
            summaryHtml += "<li>Навантаження на канал(и) прийому нормальне</li>";
        };
    };

    summaryHtml += "</ul></div><hr />";

    return summaryHtml;
}

function _calculateServerOverloadProbabilityResult(highLoadParams) {
    const userCount = highLoadParams['userCount'];
    const requestCount = highLoadParams['requestCount'];
    const requestSize = highLoadParams['requestSize'];
    const receiveSpeed = highLoadParams['receiveSpeed'];
    const channelCount = highLoadParams['channelCount'];
    const processorFrequency = highLoadParams['processorFrequency'];
    const tactCountPerOperation = highLoadParams['tactCountPerOperation'];
    const operationCountPerRequest = highLoadParams['operationCountPerRequest'];
    const serverCount = highLoadParams['serverCount'];

    // Час отримання однієї заявки (сек)
    const timeToReceiveRequest = requestSize / (receiveSpeed * channelCount);

    // Середній час між надходженнями заявок від користувача [сек]
    const avgServerReceiveTimeDelta = 60 / (userCount * requestCount);

    // Час між надходженнями заявок на сервер
    const serverReceiveTimeDelta = Math.max(timeToReceiveRequest, avgServerReceiveTimeDelta);

    // Інтенсивність надходження заявок на сервер
    const serverReceiveIntensity = 1 / serverReceiveTimeDelta;

    // Довжина такту процесора на стороні сервера
    const processorTikLength = 1 / (processorFrequency * 1000000);

    // Середній час обслуговування заявки сервером [сек]
    const avgServerRequestProcessTime = tactCountPerOperation * operationCountPerRequest * processorTikLength;

    // Інтенсивність обробки заявок сервером (заявок/сек)
    const serverRequestProcessIntensity = 1 / avgServerRequestProcessTime;

    // Імовірність завантаження обслуговуючого пристрою (сервера)
    const serverOverloadProbability = serverReceiveIntensity / (serverRequestProcessIntensity * serverCount);

    const serverLoad = serverCount * serverOverloadProbability;

    let k1 = 0.0;
    let fact1 = 0.0;
    for (let i = 0; i < serverCount; i++) {
        fact1 = Math.max(fact1, 1) * Math.max(i, 1);
        k1 = k1 + Math.pow(serverLoad, i) / fact1;
    }

    let k2 = 0.0;
    let fact2 = 0.0;
    for (let i = 0; i <= serverCount; i++) {
        fact2 = Math.max(fact2, 1) * Math.max(i, 1);
        k2 = k2 + Math.pow(serverLoad, i) / fact2;
    }

    const k = k1 / k2;

    // Швидкодія системи ???
    const c = (1 - k) / (1 - serverOverloadProbability * k);

    // Середня довжина черги в сервер
    const w = c * serverOverloadProbability / (1 - serverOverloadProbability);

    // Середня кількість елементів даних у сервері
    const q = w + serverCount * serverOverloadProbability;

    // Середній час, який заявки повинні очікувати в черзі сервера
    const tw = (c / serverCount) * avgServerRequestProcessTime / (1 - serverOverloadProbability);

    // Середній час, який заявки перебувають у сервері взагалі (с)
    const tq = tw + avgServerRequestProcessTime;

    // Стандартне відхилення середнього часу перебування заявки в сервері (с)
    const gtq = avgServerRequestProcessTime / (serverCount * (1 - serverOverloadProbability)) * (Math.sqrt(c * (2 - c) + serverCount * serverCount * (1 - serverOverloadProbability) * (1 - serverOverloadProbability)));

    // Стандартне відхилення кількості елементів даних у черзі
    const gw = (1 / (1 - serverOverloadProbability)) * (Math.sqrt(c * serverOverloadProbability * (1 + serverOverloadProbability - c * serverOverloadProbability)));

    const result = {};
    result['avgServerRequestProcessTime'] = avgServerRequestProcessTime;
    result['serverRequestProcessIntensity'] = serverRequestProcessIntensity;
    result['serverOverloadProbability'] = serverOverloadProbability;
    result['tw'] = tw;
    result['tq'] = tq;
    result['w'] = w;
    result['q'] = q;
    result['gtq'] = gtq;
    result['gw'] = gw;

    return result;
}

function _getServerOverloadProbabilitySummaryHtml(serverOverloadProbabilityResult) {
    let summaryHtml = "";
    summaryHtml += "<ul>";

    const avgServerRequestProcessTime = serverOverloadProbabilityResult['avgServerRequestProcessTime'];
    summaryHtml += `<li>Середній час обслуговування заявки сервером (с): ${avgServerRequestProcessTime}</li>`;

    const serverRequestProcessIntensity = serverOverloadProbabilityResult['serverRequestProcessIntensity'];
    summaryHtml += `<li>Інтенсивність обробки заявок сервером (заявок/сек): ${serverRequestProcessIntensity}</li>`;

    const serverOverloadProbability = serverOverloadProbabilityResult['serverOverloadProbability'];
    summaryHtml += `<li>Імовірність завантаження обслуговуючого пристрою (сервера): ${serverOverloadProbability}</li>`;

    if (serverOverloadProbability >= 1) {
        summaryHtml += "<li>Сервер(и) перевантажений(і)</li>";
    } else {
        const tw = serverOverloadProbabilityResult['tw'];
        summaryHtml += `<li>Середній час, який заявки повинні очікувати в черзі сервера Tw (с): ${tw}</li>`;

        const tq = serverOverloadProbabilityResult['tq'];
        summaryHtml += `<li>Середній час, який заявки перебувають у сервері взагалі (с) Tq: ${tq}</li>`;

        const w = serverOverloadProbabilityResult['w'];
        summaryHtml += `<li>Середня довжина черги в сервер w: ${w}</li>`;

        const q = serverOverloadProbabilityResult['q'];
        summaryHtml += `<li>Середня кількість елементів даних у сервері q: ${q}</li>`;

        const gtq = serverOverloadProbabilityResult['gtq'];
        summaryHtml += `<li>Стандартне відхилення середнього часу перебування заявки в сервері (с) GTq: ${gtq}</li>`;

        const gw = serverOverloadProbabilityResult['gw'];
        summaryHtml += `<li>Стандартне відхилення кількості елементів даних у черзі Gw: ${gw}</li>`;
        if (serverOverloadProbability < 0.5) {
            summaryHtml += `<li>Неефективне використання сервера(ів)</li>`;
        } else {
            summaryHtml += `<li>Навантаження на сервер(и) нормальне</li>`;
        }
    }
    summaryHtml += "</ul><hr />";

    return summaryHtml;
}

function _calculateAggregateChannelSendResult(highLoadParams) {
    const userCount = highLoadParams['userCount'];
    const requestCount = highLoadParams['requestCount'];
    const processorFrequency = highLoadParams['processorFrequency'];
    const tactCountPerOperation = highLoadParams['tactCountPerOperation'];
    const operationCountPerRequest = highLoadParams['operationCountPerRequest'];
    const requestSize = highLoadParams['requestSize'];
    const responseSize = highLoadParams['responseSize'];
    const channelCount = highLoadParams['channelCount'];
    const receiveSpeed = highLoadParams['receiveSpeed'];
    const sendSpeed = highLoadParams['sendSpeed'];

    // Середній час між надходженнями заявок від користувача [сек]
    const avgServerReceiveTimeDelta = 60 / (userCount * requestCount);

    // Час отримання однієї заявки (сек)
    const timeToReceiveRequest = requestSize / (receiveSpeed * channelCount);

    // Час між надходженнями заявок на сервер
    const serverReceiveTimeDelta = Math.max(timeToReceiveRequest, avgServerReceiveTimeDelta);

    // Довжина такту процесора на стороні сервера
    const processorTikLength = 1 / (processorFrequency * 1000000);

    // Середній час обслуговування заявки сервером [сек]
    const avgServerRequestProcessTime = tactCountPerOperation * operationCountPerRequest * processorTikLength;

    // Інтенсивність надходження заявок від користувачів (заявок/сек)
    const lambda = (userCount * requestCount) / 60;

    // Середній час між надходженнями заявок від сервера [сек]
    const avgReceiveDeltaTime = Math.max(serverReceiveTimeDelta, avgServerRequestProcessTime);

    // Інтенсивність надходження заявок від сервера (заявок/сек)
    const receiveIntensity = 1 / avgReceiveDeltaTime;

    // Середній час передавання однієї заявки (сек)
    const avgTransmissionTime = responseSize / (sendSpeed * channelCount);

    // Інтенсивність передачі
    const transmissionIntensity = 1 / avgTransmissionTime;

    // Інтенсивність трафіку передавання
    const trafficTransmissionIntensity = 1 / (responseSize / sendSpeed / channelCount);

    // Завантаженість агрегованого каналу передачі
    const transmissionChannelLoad = (responseSize / receiveSpeed) * lambda / channelCount;

    // Коефіцієнт використання агрегованого каналу передачі
    const transmissionChannelUsage = Math.min(transmissionChannelLoad, 1);

    // Середня довжина черги
    const avgQueueLength = transmissionChannelUsage / (1 - transmissionChannelUsage);

    // ???
    const tNSend = avgTransmissionTime * avgQueueLength * channelCount;


    const result = {};
    result['avgReceiveDeltaTime'] = avgReceiveDeltaTime;
    result['receiveIntensity'] = receiveIntensity;
    result['avgTransmissionTime'] = avgTransmissionTime;
    result['transmissionIntensity'] = transmissionIntensity;
    result['trafficTransmissionIntensity'] = trafficTransmissionIntensity;
    result['transmissionChannelLoad'] = transmissionChannelLoad;
    result['transmissionChannelUsage'] = transmissionChannelUsage;
    result['avgQueueLength'] = avgQueueLength;
    result['tNSend'] = tNSend;

    return result;
}

function _getAggregateChannelSendSummaryHtml(aggregateChannelSendResult) {
    let summaryHtml = "";
    summaryHtml += "<ul>"

    const receiveIntensity = aggregateChannelSendResult['receiveIntensity'];
    summaryHtml += `<li>Інтенсивність надходження заявок від сервера (заявок/сек): ${receiveIntensity}</li>`;

    const avgTransmissionTime = aggregateChannelSendResult['avgTransmissionTime'];
    summaryHtml += `<li>Час передавання однієї заявки (сек): ${avgTransmissionTime}</li>`;

    const transmissionChannelLoad = aggregateChannelSendResult['transmissionChannelLoad'];
    summaryHtml += `<li>Завантаженість агрегованого каналу передачі: ${transmissionChannelLoad}</li>`;

    const transmissionChannelUsage = aggregateChannelSendResult['transmissionChannelUsage'];
    summaryHtml += `<li>Коефіцієнт використання агрегованого каналу передачі: ${transmissionChannelUsage}</li>`;

    const trafficTransmissionIntensity = aggregateChannelSendResult['trafficTransmissionIntensity'];
    summaryHtml += `<li>Інтенсивність трафіку передавання: ${trafficTransmissionIntensity}</li>`;

    if (transmissionChannelUsage >= 1) {
        summaryHtml += "<li>Канал(и) передачі перевантажений(і)</li>";
    } else {
        const avgQueueLength = aggregateChannelSendResult['avgQueueLength'];
        summaryHtml += `<li>Середня довжина черги: ${avgQueueLength}</li>`;

        if (transmissionChannelUsage < 0.5) {
            summaryHtml += "<li>Неефективне використання канал(ів) передачі</li>";
        } else {
            summaryHtml += "<li>Навантаження на канал(и) передачі нормальне</li>";
        }
    }
    summaryHtml += "</ul><hr />";

    return summaryHtml
}

function _calculateGeneralResult(highLoadParams) {
    const receiveSpeed = highLoadParams['receiveSpeed'];
    const sendSpeed = highLoadParams['sendSpeed'];
    const channelType = highLoadParams['channelType'];

    const aggregateChannelReceiveResult = _calculateAggregateChannelReceiveResult(highLoadParams);
    const serverOverloadProbabilityResult = _calculateServerOverloadProbabilityResult(highLoadParams);
    const aggregateChannelSendResult = _calculateAggregateChannelSendResult(highLoadParams);

    // Коефіцієнт використання агрегованого каналу прийому
    const coefficientOfChannelUsage = aggregateChannelReceiveResult['coefficientOfChannelUsage'];

    // Імовірність завантаження обслуговуючого пристрою (сервера)
    const serverOverloadProbability = serverOverloadProbabilityResult['serverOverloadProbability'];

    // Коефіцієнт використання агрегованого каналу передачі
    const transmissionChannelUsage = aggregateChannelSendResult['transmissionChannelUsage'];

    // Час отримання однієї заявки (сек)
    const timeToReceiveRequest = aggregateChannelReceiveResult['timeToReceiveRequest'];

    // ???
    const tNReceive = aggregateChannelReceiveResult['tNReceive'];

    // Середній час, який заявки перебувають у сервері взагалі (с)
    const tq = serverOverloadProbabilityResult['tq'];

    // Середній час обслуговування заявки сервером [сек]
    const avgServerRequestProcessTime = serverOverloadProbabilityResult['avgServerRequestProcessTime'];

    // Середній час передавання однієї заявки (сек)
    const avgTransmissionTime = aggregateChannelSendResult['avgTransmissionTime'];

    // ???
    const tNSend = aggregateChannelSendResult['tNSend'];

    // Час, який користувач чекає на відповідь
    const userWaitTime = timeToReceiveRequest + tNReceive + tq + avgTransmissionTime + tNSend;

    // Мінімальний час, за який користувач отримує відповідь (без черги)
    const userWaitTimeMin = timeToReceiveRequest + avgServerRequestProcessTime + avgTransmissionTime;

    // Середня швидкість прийому
    const avgReceiveSpeed = receiveSpeed * coefficientOfChannelUsage;

    // Середня швидкість передачі
    const avgSendSpeed = sendSpeed * transmissionChannelUsage;

    const result = {};
    result['coefficientOfChannelUsage'] = coefficientOfChannelUsage;
    result['serverOverloadProbability'] = serverOverloadProbability;
    result['transmissionChannelUsage'] = transmissionChannelUsage;
    result['userWaitTime'] = userWaitTime;
    result['userWaitTimeMin'] = userWaitTimeMin;
    result['avgReceiveSpeed'] = avgReceiveSpeed;
    result['avgSendSpeed'] = avgSendSpeed;
    result['channelType'] = channelType;
    result['receiveSpeed'] = receiveSpeed;
    result['sendSpeed'] = sendSpeed;

    return result;
}

function _getGeneralSummaryHtml(generalResult) {
    let summaryHtml = "";
    summaryHtml += "<ul>";

    const coefficientOfChannelUsage = generalResult['coefficientOfChannelUsage'];
    const serverOverloadProbability = generalResult['serverOverloadProbability'];
    const transmissionChannelUsage = generalResult['transmissionChannelUsage'];
    if ((coefficientOfChannelUsage >= 1) || (serverOverloadProbability >= 1) || (transmissionChannelUsage >= 1)) {
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
        const userWaitTime = generalResult['userWaitTime'];
        summaryHtml += `<li>Час, який користувач чекає на відповідь: ${userWaitTime}</li>`;

        const userWaitTimeMin = generalResult['userWaitTimeMin'];
        summaryHtml += `<li>Мінімальний час, за який користувач отримує відповідь (без черги): ${userWaitTimeMin}</li>`;
    }

    const avgReceiveSpeed = generalResult['avgReceiveSpeed'];
    summaryHtml += `<li>Середня швидкість прийому: ${avgReceiveSpeed}</li>`;

    const avgSendSpeed = generalResult['avgSendSpeed'];
    summaryHtml += `<li>Середня швидкість передачі: ${avgSendSpeed}</li>`;

    const channelType = generalResult['channelType'];
    if (channelType == SIMPLEX_CHANNEL_TYPE) {
        const receiveSpeed = generalResult['receiveSpeed'];
        summaryHtml += `<li>Максимальна швидкість приймання: ${receiveSpeed}</li>`;

        const sendSpeed = generalResult['sendSpeed'];
        summaryHtml += `<li>Максимальна швидкість передачі: ${sendSpeed}</li>`;
    }
    summaryHtml += "</ul>";

    return summaryHtml;
}
