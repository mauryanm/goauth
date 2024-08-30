let timerTime = LOGED_IN_TIMER_BEFORE;
let interval;
let intervalNav;
let modeljc = false;
var tmopn = false;
var popuptime;
const tableinformation = (tbl,heding) => {
    $('#page_title').html('<h4 class=\"mb-sm-0 font-size-18\">' + heding +'</h4>');
    // $('#totalrc').text('Total Records: ' + tbl.fnSettings().json.recordsTotal)
}
const start = (m,s) => {
    interval = setInterval(() => { incrementTimer(m,s) }, 1000);
}
const stop = () => {
    clearInterval(interval);
}

const pad = (number) => {
    return (number < 10) ? '0' + number : number;
}

const incrementTimer = (m,s) => {
    const numberMinutes = Math.floor(timerTime / 60);
    const numberSeconds = timerTime % 60;
    if(numberMinutes == 0 && numberSeconds == 0){
        clearInterval(intervalNav);
        popuptimer();
    }
    if (m && s) {
        $(m).text(pad(numberMinutes));
        $(s).text(pad(numberSeconds));
    }
    $("#timermin_nav").text(pad(numberMinutes));
    $("#timersec_nav").text(pad(numberSeconds));
    $("#timermin_page").text (pad(numberMinutes));
    $("#timersec_page").text(pad(numberSeconds));
    
    timerTime--; 
}
  
function popuptimer(){   
        axios.post('/get-session-activity').then(function (response) {
            timerTime = response.data.time;
            popuptime = (timerTime > LOGED_IN_TIMER_BEFORE ? timerTime - LOGED_IN_TIMER_BEFORE : timerTime);
            
            
            if (response.data.logout) {
                window.location.href = '/logout';
                // document.getElementById('logout-form').submit();
            }
            if (response.data.show_popup) {
                tmopn = true;
                
                if (!modeljc) {
                    openpopupofftimer(); 
                }                
               
            } else {
                if (modeljc) {
                    modeljc.close();
                    modeljc=false;
                    tmopn = false;
                    clearTimeout(timeoutofpopup);
                    timeoutofpopup = setTimeout(() => {
                        popuptimer();
                    }, popuptime);
                }
            }
            
        })
        
}
function openpopupofftimer(){
    modeljc = $.confirm({
        title: INACTIVE_MODEL_HEADER,
        content: '<p>Try after <span id="timermin_page">' + pad(Math.floor(LOGED_IN_TIMER_BEFORE / 60)) + '</span> Min & <span id="timersec_page">' + pad(LOGED_IN_TIMER_BEFORE % 60) + '</span> Sec</p>',
        type: 'red',
        confirmButtom: false,
        typeAnimated: true,
        buttons: {
            tryAgain: {
                text: 'Logout',
                btnClass: 'btn-red',
                action: function () {
                    tmopn = false;
                    window.location = "\logout";
                }
            },
            close: {
                text: 'Continue',
                action: function () {
                    tmopn = false;
                    modeljc = false;
                    stop();
                    axios.post('/set-session-activity').then(function (response) {
                        timerTime = MAX_LOGED_IN_TIME;
                        clearTimeout(timeout);
                        timeout = setTimeout(function () {
                            popuptimer()
                            // document.getElementById('logout-form').submit();
                        }, timerTime * 1000);
                        clearTimeout(timeoutofpopup);
                        timeoutofpopup = setTimeout(() => {
                            popuptimer()
                        }, timeofpopup);
                    })
                }
            }
        }
    });
}
function getTargetType(id){
    switch (id) {
        case 1:
            return "Phone";
            break;
        
        case 2:
            return "Fax";
            break;

        case 3:
            return "Mobile";
            break;

        case 4:
            return "IMSI";
            break;
        
        case 5:
            return "IMEI";
            break;
        
        default:
            return "Undefind";
    }
}
function checkInputfield(my_choices) {
    let inner_element = my_choices.containerInner.element;
    if (my_choices.getValue(true)) {
      inner_element.classList.remove('is-invalid');
    } else {
      inner_element.classList.add('is-invalid');
    }
  }
window.addEventListener('load', function () {
    var forms = document.getElementsByClassName('needs-validation'); 
    var validation = Array.prototype.filter.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
}, false);

  document.addEventListener('DOMContentLoaded', function () {
    var selectField = document.querySelectorAll('[data-select]');  
    for (i = 0; i < selectField.length; ++i) {
      var element = selectField[i];
      var choiceEliment = new Choices(element, {
        placeholderValue: 'This is a placeholder set in the config',
        searchPlaceholderValue: 'This is a search placeholder'
      });
      choiceEliment.passedElement.element.addEventListener('change', function() {
        checkInputfield(choiceEliment);
      });
      
    } 
  })
function formatemsg(array) {
    if (typeof array == 'object') {
        var response = array;
    } else {
        var response = JSON.parse(array);
    }
    
    var errorString = '<ul class="list-group list-group-flush text-start">';
    $.each(response, function (key, value) {
        if (typeof value == 'object') {
            // errorString += '<li class="list-group-item"><b>' + key.replace(/(?:_| |\b)(\w)/g, function ($1) { return $1.toUpperCase().replace('_', ' '); }) + '</b></li>';
            $.each(value, function (k, v) {
                errorString += '<li class="list-group-item">' + v + '</li>';
            });
        } else {
            errorString += '<li class="list-group-item">' + value + '</li>';
        }
        
    });
    errorString += '</ul>';
    return errorString;
}
$(document).ready(function () {
    $(".select2").select2();
    $(document).ajaxSuccess(function () {
        $("body .tbl-hover").hover(function () {
            console.log($(this))
            let content = $(this).html();
            $(this).append('<div class="text-hover position-absolute">' + content + '</div>')
        }, function () {
            console.log('out');
            $(this).children('.text-hover').remove()
            // $(this).stop(true, false).animate({ width: "100px" });
        });
    })
  })