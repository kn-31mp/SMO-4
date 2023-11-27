function Results() { 
    
    var x = mainFrame.document.FormManyServ;
    var rNuser = x.Nuser.value;
    var rNquery = x.Nquery.value;
    var rLServ = x.LServ.value;
    var rFreq = x.Freq.value;
    var rChannelSpeed=x.ChannelSpeed.value;
    var rNTactPerOper=x.NTactPerOper.value;
    var rNOperPerReq=x.NOperPerReq.value;
    var rRazmPacReq=x.RazmPacReq.value;
    var rRazmPacAns=x.RazmPacAns.value;
    var rChannelType=x.ChannelType.value;
    var rNumLine=x.NumLine.value;
    
    mainFrame.document.write("<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=charset=windows-1251\"></head><body  background=\"background.gif\">"); 
    mainFrame.document.write("<p><blockquote><b> ПОЛУЧЕННЫЕ РЕЗУЛЬТАТЫ <br>");
    mainFrame.document.write("</b></blockquote></p>");
   
    if (rChannelType == "Duplex") {
        ReceiveSpeed = rChannelSpeed;
        SendSpeed = rChannelSpeed;
    } 
    else if (rChannelType == "Symplex") {
        var ReceiveSpeed = rChannelSpeed*rRazmPacReq/(rRazmPacReq+rRazmPacAns);//Делим пропорционально размерам пакетов
        var SendSpeed = rChannelSpeed*rRazmPacAns/(rRazmPacReq+rRazmPacAns);
    }
    
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

   DeltaTRecv=60/(rNuser*rNquery); //Среднее время между поступлениями заявок от пользователя[сек]
   Lamda=(rNuser*rNquery)/60; //интенсивность поступления заявок от пользователя [1/сек]
   TrecvQuery=rRazmPacReq/(ReceiveSpeed*rNumLine); //Время на получение одной заявки
   MuRecv=1/TrecvQuery; //интенсивность приема
   RoRecv=Lamda/(MuRecv); //Загруженность канала приема
   UispRecv=Math.min(RoRecv*rNumLine,rNumLine)/rNumLine; //Коэффициэнт использования канала
   mainFrame.document.write("<ul><p></p><li>Интенсивность поступления заявок от пользователей (заявок/сек):   " + Lamda);
   mainFrame.document.write("<p></p><li>Время получения одной заявки (сек):   " + TrecvQuery);
   mainFrame.document.write("<p></p><li>Загруженность агрегированного канала приема (норма <1):   " + RoRecv);
   mainFrame.document.write("<p></p><li>Коэффициэнт использования агрегированного канала приема:   " + UispRecv);
   if (UispRecv>=1)
    {
     mainFrame.document.write("<p></p><li>Канал(ы) приема перегружен(ы)");
    }
   else 
   {
    NsrRecv=UispRecv/(1-UispRecv); //Средняя длина очереди
    TNRecv=TrecvQuery*NsrRecv*rNumLine; //считаем что одна заявка передается только по 1 каналу
    mainFrame.document.write("<p></p><li>Средняя длина очереди:   " + NsrRecv);
    if (UispRecv<0.5)
    {
     mainFrame.document.write("<p></p><li>Неэффективное использование канал(ов) приема");
    }
    else
    {
     mainFrame.document.write("<p></p><li>Нагрузка на канал(ы) приема нормальная");
    };
   };
   mainFrame.document.write("</ul><br><hr>");
   
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

   DeltaTServ=Math.max(TrecvQuery,DeltaTRecv); //Время между поступлениями заявок на сервер
   LamdaServ=1/DeltaTServ; //Интенсивность поступления заявок на сервер
   Ttact=1/(rFreq*1000000); //время одного такта в сек
   Ts=rNTactPerOper*rNOperPerReq*Ttact; //Вpемя обслуживания заявки процессором [сек]
   Mu=1/Ts; //Интенсивность обслуживания заявок сервером
   RoServ=LamdaServ/(Mu*rLServ); //Вероятность загрузки сервера
   mainFrame.document.write("<ul><p></p><li>Интенсивность обработки заявок сервером (заявок/сек):   " + Mu);
   mainFrame.document.write("<p></p><li>Вероятность загрузки обслуживающего устройства (сервера):   " + RoServ);
   mainFrame.document.write("<p></p><li>Среднее время обслуживания заявки сервером (с):   " + Ts);
   Pzagr=rLServ*RoServ; 
   K1=0.0;
   Fact1=0.0;
   for (var i=0; i<rLServ; i++)
   {
    Fact1=Math.max(Fact1, 1) * Math.max(i, 1);
    K1=K1+(Math.pow(Pzagr,i))/Fact1;
   } 
   K2=0.0;
   Fact2=0.0;
   for (var i=0; i<=rLServ; i++) 
   {
   Fact2=Math.max(Fact2, 1) * Math.max(i, 1);
    K2=K2+(Math.pow(Pzagr,i))/Fact2;
   }
   K=K1/K2;
   //mainFrame.document.write("<li><p></p>K1:   " +K1 );
   //mainFrame.document.write("<li><p></p>K2:   " +K2 );
   //mainFrame.document.write("<li><p></p>K:   " +K );
   
  C=(1-K)/(1-RoServ*K); //Быстродействие системы ???
   //mainFrame.document.write("<li><p></p>C:   " +C);
   
  w=C*RoServ/(1-RoServ); //Количество заявок в очереди
  //mainFrame.document.write("<li><p></p>w:   " +w );
   q=w+rLServ*RoServ;  //Количество заявок в системе сервера
  //mainFrame.document.write("<li><p></p>q:   " +q );
   Tw=(C/rLServ)*Ts/(1-RoServ); //Среднее время ожидания в очереди
  //mainFrame.document.write("<li><p></p>Tw:   " +Tw );
   Tq=Tw+Ts; //Среднее время нахождения на сервере
  //mainFrame.document.write("<li><p></p>Tq:   " +Tq );
   GTq=Ts/(rLServ*(1-RoServ))*(Math.sqrt(C*(2-C)+rLServ*rLServ*(1-RoServ)*(1-RoServ))); //отклонение времени нахождения заявки в системе
  // mainFrame.document.write("<li><p></p>GTq:   " +GTq );
  Gw=(1/(1-RoServ))*(Math.sqrt(C*RoServ*(1+RoServ-C*RoServ))); //отклонение количества элементов данных в очереди
  // mainFrame.document.write("<li><p></p>Gw:   " +Gw);
  if (RoServ>=1)
    {
     mainFrame.document.write("<p></p><li>Cервер(ы) перегружен(ы)");
    }
   else 
   {
    mainFrame.document.write("<p></p><li>Среднее время, которое заявки должны ожидать в очереди сервера Tw (с):   " + Tw);
    mainFrame.document.write("<p></p><li>Среднее время, которое заявки  находятся в сервере вообще (с) Tq:   " + Tq);
    mainFrame.document.write("<p></p><li>Средняя длина очереди в сервер: w  " + w);
    mainFrame.document.write("<p></p><li>Среднее количество элементов данных в сервере q:   " + q);
    mainFrame.document.write("<p></p><li>Стандартное отклонение среднего времени нахождения заявки в сервере (с) GTq:   " +GTq );
    mainFrame.document.write("<p></p><li>Стандартное отклонение количества элементов данных в очереди Gw:  " + Gw);
    if (RoServ<0.5)
    {
     mainFrame.document.write("<p></p><li>Неэффективное использование сервера(ов)");
    }
    else
    {
     mainFrame.document.write("<p></p><li>Нагрузка на сервер(ы) нормальная");
    };
   };
   mainFrame.document.write("</ul><br><hr>");

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

   DeltaTSend=Math.max(DeltaTServ,Ts); //Среднее время между поступлениями заявок от сервера[сек]
   LamdaSend=1/DeltaTSend; //интенсивность поступления заявок от сервера [1/сек]
   TSendQuery=rRazmPacAns/(SendSpeed*rNumLine); //Время на отправление одной заявки
   MuSend=1/TSendQuery; //интенсивность передачи
   uSend=1/(rRazmPacAns/SendSpeed/rNumLine);      
   pSend=(rRazmPacAns/ReceiveSpeed)*Lamda/rNumLine;
   UispSend=Math.min(pSend,1); //Коэффициэнт использования агрегированного канала
   mainFrame.document.write("<ul><p></p><li>Интенсивность поступления заявок от сервера (заявок/сек):   " + LamdaSend);
   mainFrame.document.write("<p></p><li>Время передачи одной заявки (сек):   " + TSendQuery);
   mainFrame.document.write("<p></p><li>Загруженность агрегированного канала передачи: " + pSend);
    mainFrame.document.write("<p></p><li>Коеффициент использования агрегированного канала передачи: " + UispSend);
   mainFrame.document.write("<p></p><li>Интенсивность трафика передачи: " + uSend);
   if (UispSend>=1)
    {
     mainFrame.document.write("<p></p><li>Канал(ы) передачи перегружен(ы)");
    }
   else 
   {
    NsrSend=UispSend/(1-UispSend); //Средняя длина очереди
    TNSend=TSendQuery*NsrSend*rNumLine;
    mainFrame.document.write("<p></p><li>Средняя длина очереди:   " + NsrSend);
    if (UispSend<0.5)
    {
     mainFrame.document.write("<p></p><li>Неэффективное использование канал(ов) передачи");
    }
    else
    {
     mainFrame.document.write("<p></p><li>Нагрузка на канал(ы) передачи нормальная");
    };
   };
   mainFrame.document.write("</ul><br><hr>");

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
   if ((UispSend>=1)||(RoServ>=1)||(UispRecv>=1))
    {
     mainFrame.document.write("<p></p><li>Пользователь будет ждать ответа с каждым запросом все дольше, поскольку СМО не справляется с таким потоком данных. Очередь запросов будет возрастать до тех пор пока не переполнится буффер. После чего запросы вообще начнут теряться. Необходимо изменить параметры системы, чтобы она справлась с нагрузкой. Иначе система очень быстро не все пользователи получат ответы из-за перегрузки СМО.<br>");
    }
   else 
   {
    Tuser_wait=TrecvQuery+TNRecv+Tq+TSendQuery+TNSend;
    mainFrame.document.write("<p></p><li>Время, которое пользователь ждет ответа:  " + Tuser_wait);
    Tuser_waitMin=TrecvQuery+Ts+TSendQuery;
    mainFrame.document.write("<p></p><li>Минимальное время, за которое пользователь получает ответ(без очереди):  " + Tuser_waitMin);
   };
   mainFrame.document.write("<p></p><li>Cредняя скорость приема:  " + ReceiveSpeed*UispRecv);
   mainFrame.document.write("<p></p><li>Cредняя скорость передачи:  " + SendSpeed*UispSend);
   if (rChannelType=="Symplex")
    {
     mainFrame.document.write("<p></p><li>Максимальная скорость приема:  " + ReceiveSpeed);
     mainFrame.document.write("<p></p><li>Максимальная скорость передачи:  " + SendSpeed);
    };
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   mainFrame.document.write("</ul></body></html>");
  }