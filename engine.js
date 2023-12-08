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
    const channelSummaryHtml = _getAggregateChannelSummaryHtml(aggregateChannelResult);
    parentElement.innerHTML += channelSummaryHtml;

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

    parentElement.innerHTML += ("<ul><p></p><li>Интенсивность обработки заявок сервером (заявок/сек):   " + Mu);
    parentElement.innerHTML += ("<p></p><li>Вероятность загрузки обслуживающего устройства (сервера):   " + RoServ);
    parentElement.innerHTML += ("<p></p><li>Среднее время обслуживания заявки сервером (с):   " + Ts);

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
        parentElement.innerHTML += ("<p></p><li>Cервер(ы) перегружен(ы)");
    } else {
        parentElement.innerHTML += ("<p></p><li>Среднее время, которое заявки должны ожидать в очереди сервера Tw (с):   " + Tw);
        parentElement.innerHTML += ("<p></p><li>Среднее время, которое заявки  находятся в сервере вообще (с) Tq:   " + Tq);
        parentElement.innerHTML += ("<p></p><li>Средняя длина очереди в сервер: w  " + w);
        parentElement.innerHTML += ("<p></p><li>Среднее количество элементов данных в сервере q:   " + q);
        parentElement.innerHTML += ("<p></p><li>Стандартное отклонение среднего времени нахождения заявки в сервере (с) GTq:   " +GTq );
        parentElement.innerHTML += ("<p></p><li>Стандартное отклонение количества элементов данных в очереди Gw:  " + Gw);
        if (RoServ<0.5) {
            parentElement.innerHTML += ("<p></p><li>Неэффективное использование сервера(ов)");
        } else {
            parentElement.innerHTML += ("<p></p><li>Нагрузка на сервер(ы) нормальная");
        }
    }
    parentElement.innerHTML += ("</ul><br><hr>");

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

    let DeltaTSend = Math.max(DeltaTServ,Ts); //Среднее время между поступлениями заявок от сервера[сек]
    let LamdaSend = 1/DeltaTSend; //интенсивность поступления заявок от сервера [1/сек]
    let TSendQuery = rRazmPacAns/(SendSpeed*rNumLine); //Время на отправление одной заявки
    let MuSend = 1/TSendQuery; //интенсивность передачи
    let uSend = 1/(rRazmPacAns/SendSpeed/rNumLine);
    let pSend = (rRazmPacAns / ReceiveSpeed) * Lamda / rNumLine;
    let UispSend = Math.min(pSend,1); //Коэффициэнт использования агрегированного канала

    parentElement.innerHTML += ("<ul><p></p><li>Интенсивность поступления заявок от сервера (заявок/сек):   " + LamdaSend);
    parentElement.innerHTML += ("<p></p><li>Время передачи одной заявки (сек):   " + TSendQuery);
    parentElement.innerHTML += ("<p></p><li>Загруженность агрегированного канала передачи: " + pSend);
    parentElement.innerHTML += ("<p></p><li>Коеффициент использования агрегированного канала передачи: " + UispSend);
    parentElement.innerHTML += ("<p></p><li>Интенсивность трафика передачи: " + uSend);
    
    if (UispSend>=1) {
        parentElement.innerHTML += ("<p></p><li>Канал(ы) передачи перегружен(ы)");
    } else {
        let NsrSend=UispSend/(1-UispSend); //Средняя длина очереди
        TNSend=TSendQuery*NsrSend*rNumLine;
        parentElement.innerHTML += ("<p></p><li>Средняя длина очереди:   " + NsrSend);

        if (UispSend<0.5) {
            parentElement.innerHTML += ("<p></p><li>Неэффективное использование канал(ов) передачи");
        } else {
            parentElement.innerHTML += ("<p></p><li>Нагрузка на канал(ы) передачи нормальная");
        }
    }
    parentElement.innerHTML += ("</ul><br><hr>");

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
    if ((UispSend>=1)||(RoServ>=1)||(UispRecv>=1)) {
        parentElement.innerHTML += ("<p></p><li>Пользователь будет ждать ответа с каждым запросом все дольше, поскольку СМО не справляется с таким потоком данных. Очередь запросов будет возрастать до тех пор пока не переполнится буффер. После чего запросы вообще начнут теряться. Необходимо изменить параметры системы, чтобы она справлась с нагрузкой. Иначе система очень быстро не все пользователи получат ответы из-за перегрузки СМО.<br>");
    } else {
        let Tuser_wait = TrecvQuery+TNRecv+Tq+TSendQuery+TNSend;
        parentElement.innerHTML += ("<p></p><li>Время, которое пользователь ждет ответа:  " + Tuser_wait);
        let Tuser_waitMin = TrecvQuery+Ts+TSendQuery;
        parentElement.innerHTML += ("<p></p><li>Минимальное время, за которое пользователь получает ответ(без очереди):  " + Tuser_waitMin);
    }
    parentElement.innerHTML += ("<p></p><li>Cредняя скорость приема:  " + ReceiveSpeed*UispRecv);
    parentElement.innerHTML += ("<p></p><li>Cредняя скорость передачи:  " + SendSpeed*UispSend);
    if (rChannelType == SIMPLEX_CHANNEL_TYPE) {
        parentElement.innerHTML += ("<p></p><li>Максимальная скорость приема:  " + ReceiveSpeed);
        parentElement.innerHTML += ("<p></p><li>Максимальная скорость передачи:  " + SendSpeed);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    parentElement.innerHTML += ("</ul>");
}

function _retrieveHighLoadFormParams(highLoadSystemForm) {
    let highLoadParams = {}

    highLoadParams['userCount'] = highLoadSystemForm['userCount'].value;
    highLoadParams['requestCount'] = highLoadSystemForm['requestCount'].value;
    highLoadParams['serverCount'] = highLoadSystemForm['serverCount'].value;
    highLoadParams['processorFrequency'] = highLoadSystemForm['processorFrequency'].value;
    highLoadParams['channelSpeed'] = highLoadSystemForm['channelSpeed'].value;
    highLoadParams['tactCountPerOperation'] = highLoadSystemForm['tactCountPerOperation'].value;
    highLoadParams['operationCountPerRequest'] = highLoadSystemForm['tactCountPerOperation'].value;
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

function _getAggregateChannelSummaryHtml(aggregateChannelResult) {
    let channelSummaryHtml = "";

    channelSummaryHtml += "<div><ul>";

    const lambda = aggregateChannelResult['lambda'];
    channelSummaryHtml += `<li>Интенсивность поступления заявок от пользователей (заявок/сек): ${lambda}</li>`;

    const timeToReceiveRequest = aggregateChannelResult['timeToReceiveRequest'];
    channelSummaryHtml += `<li>Время получения одной заявки (сек): ${timeToReceiveRequest}</li>`;

    const channelLoad = aggregateChannelResult['channelLoad'];
    channelSummaryHtml += `<li>Загруженность агрегированного канала приема (норма <1): ${channelLoad}</li>`;

    const coefficientOfChannelUsage = aggregateChannelResult['coefficientOfChannelUsage'];
    channelSummaryHtml += `<li>Коэффициэнт использования агрегированного канала приема: ${coefficientOfChannelUsage}</li>`;

    if (coefficientOfChannelUsage >= 1) {
        channelSummaryHtml += "<li>Канал(ы) приема перегружен(ы)</li>";
    } else {
        const averageQueueSize = aggregateChannelResult['averageQueueSize'];
        channelSummaryHtml += `<li>Средняя длина очереди: ${averageQueueSize}</li>`;

        if (coefficientOfChannelUsage<0.5) {
            channelSummaryHtml += "<li>Неэффективное использование канал(ов) приема</li>";
        } else {
            channelSummaryHtml += "<li>Нагрузка на канал(ы) приема нормальная</li>";
        };
    };

    channelSummaryHtml += "</ul></div><hr>";

    return channelSummaryHtml;
}
