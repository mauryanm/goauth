function clearself(field) {
    delete search_filter[field];
    let fieldArr = field.split('.');
    if (field.includes('.')) {
        field = fieldArr[fieldArr.length - 1]
    }
    $('#' + field).val('');
    $('#' + field + '_con').prop("selectedIndex", 0).trigger('change')
}
function callIdentification(id) {
    if (wavesurferlist.isPlaying()) {
        wavesurferlist.pause();
    }
    var row = window.LaravelDataTables["cdr-table"].row($('#' + id)).data();
    $('.modal_loader').show();

    if (row.int_call_data_type == 1) {
        row.txt_file_path = path + row.txt_file_name;
        openvoicemodal(row)
    } else if (row.int_call_data_type == 7) {
        row.txt_file_path = path + row.txt_file_name;
        axios.post("/convertfile/mp4", {
            file_path: row.txt_file_path
        }).then(function (response) {
            row.txt_file_path = response.data;
            $('.video-warper').show();
            $('#videosorce').attr('src', row.txt_file_path);
            $('#sorcevideo').attr('src', row.txt_file_path);
            openvoicemodal(row)
        });

    } else if (row.int_call_data_type == 5) {
        opensmsmodal(row.lng_cdr_id);
    } else {
        $('.modal_loader').hide();
    }
    if (row.int_call_status_type !== 2) {
        updatecdr(id,'int_call_status_type',2);
    }

}
function openvoicemodal(row) {
    var row = window.LaravelDataTables["cdr-table"].row($('#' + row.lng_cdr_id)).data();
    $("#play-file").modal('show');
    $("#play-file .modal-title").text("Play File [ CDR ID : " + row.lng_cdr_id + " ]");
    $('.info_btn_unique').data('id', row.lng_cdr_id);
    loadwavesurfer(row);
    if (row.int_call_status_type !== 2) {
        updatecdr(row.lng_cdr_id, 'int_call_status_type', 2);
    }
    // document.getElementById('#info_btn').setAttribute('data-id',row.lng_cdr_id)
}
function opensmsmodal(id) {
    var row = window.LaravelDataTables["cdr-table"].row($('#' + id)).data();
    $("#msgmodal").modal('show');
    $("#msgmodal .modal-title").text("SMS Message [ CDR ID : " + row.lng_cdr_id + " ]");
    $("#msgmodal .modal-body").html('<p class="font-size-18">' + row.cri.txt_sms_decoded + '</p>');
    $('.info_btn_unique').attr('onclick', 'showDetails(' + row.lng_cdr_id + ')');
    if (row.int_call_status_type !== 2) {
        updatecdr(id, 'int_call_status_type', 2);
    }
    // document.getElementById('info_btn_sms').setAttribute('data-id',row.lng_cdr_id)
}
function updatecdr(id, col, val) {
    axios.post('/update-cdr', { lng_cdr_id: id,col:col,val:val}).then(function (response) {
        window.LaravelDataTables["cdr-table"].draw('page');
        $("#remarkmodal #txt_remarks_mod").val('');
        $("#remarkmodal").modal('hide');
        responsemessage(col,val,response);
    });
}
function resetfilter() {
    int_call_priority_type = int_call_status_type = int_direction = undefined;
    search_filter = {};
    advance_filter = {};
    $('.info_btn_unique').attr('onclick', '');
    $("#msgmodal .modal-body").html('');
    filterByDate(0)
    cdr_total = 0;
    window.LaravelDataTables["cdr-table"].draw();
    $('.searchBox input:not([type=hidden])').val("");
    $('.searchBox select').prop("selectedIndex", 0).trigger('change')
}
function showDetails(id) {
    $("#detailsModal").modal('show');
    const detailsModal = document.getElementById('detailsModal');
    fetch('/search/'+id).then(res => res.text()).then(html => {
        $("#detailsModal .modal-body").html(html);
    });
    // updatecdr(id,'int_call_status_type',2);    
}
var playlistid = [];
function playlist(id) {
    $('.sideplayer').show();
    if (playlistid.includes(id)) {
            return false;
        }
    let row = window.LaravelDataTables["cdr-table"].row($('#' + id)).data();
    let filepath = path + row.txt_file_name;
    let prepair_file = ' <li class="play-list-item position-relative border-top"><i data-feather="eye" data-size="16" class="mt-0 cdrplayer" onclick="callIdentification(' + row.lng_cdr_id + ')"></i><a data-id="' + row.lng_cdr_id + '" class="d-flex justify-content-between ps-5" href="' + filepath + '"><i class="mt-0" data-feather="music"></i><span data-key="t-player">' + row.lng_cdr_id + '</span><span>' + row.lng_duration + '</span></a> <i class="text-danger fa fa-trash-alt removelistitem" onclick="removelistitems(this,' + row.lng_cdr_id + ')"></i><span class="play-list-info">CDR ID : ' + row.lng_cdr_id + '&nbsp;&nbsp;&nbsp; Target : ' + row.target.txt_target_name + '<br> Calling No. : ' + row.cri.txt_calling_number + '&nbsp;&nbsp;&nbsp; Called No. : ' + row.cri.txt_called_number + '</span></li>';
    $('#playlistend').before(prepair_file);
    $('.play-list-item').each(function (i, a) {
        $(a).replaceWith($(a).clone());
    });
    playlinks = document.querySelectorAll('.play-list-item a');
    if (playlinks.length == 1) {
        setTimeout(() => {
            setCurrentSong(0)
        }, 50);
    }
    Array.prototype.forEach.call(playlinks, function (link, index) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            setCurrentSong(index);
            return false;
        });
    });
    
    feather.replace();
    // var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    //     return new bootstrap.Tooltip(tooltipTriggerEl)
    // })
    playlistid.push(id); 
}
function removelistitems(s, id) {
    playlistid = playlistid.filter(item => item !== id);
    let linklength = playlinks.length;
    if (linklength > 1) {
        if ($(s).siblings('a').hasClass('active-track')) {
            if (wavesurferlist.isPlaying()) {
                wavesurferlist.pause();
            }
            setTimeout(() => {
                setCurrentSong(0);
            }, 500);
            
        }
    } else {
        $('.sideplayer').hide();
        if (wavesurferlist.isPlaying()) {
            wavesurferlist.pause();
        }
        wavesurferlist.empty();
        playloopready = false;
        // wavesurferlist.destroy();
    }
    $(s).closest('li').remove();
    $('.play-list-item').each(function (i, a) {
        $(a).replaceWith($(a).clone());
    });
    playlinks = document.querySelectorAll('.play-list-item a');
    Array.prototype.forEach.call(playlinks, function (link, index) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            setCurrentSong(index);
            return false;
        });
    });
}
function createDropdownMenu(row, top, left) {
    let contextmenu = '<ul class="dropdown-menu d-block" role="menu" aria-labelledby="dropdownMenu">'
    if (row.int_call_data_type == 1 || row.int_call_data_type == 7) {
        contextmenu += '<li> <a class="dropdown-item" href="#" onclick="callIdentification(' + row.lng_cdr_id +')"><i class="fa fa-play"></i> Play</a></li>'
    }
    if (row.int_call_data_type == 5) {
        contextmenu += '<li> <a class="dropdown-item" href="#" onclick="opensmsmodal(' + row.lng_cdr_id + ')"><i class="fa fa-envelope"></i> Show SMS</a></li>';
    }
    contextmenu += '<li><a class="dropdown-item" href="#" onclick="showDetails(' + row.lng_cdr_id + ')"><i class="fa fa-info-circle"></i> Show Details</a></li>';

    if (row.int_call_data_type == 1) {
        contextmenu += '<li><a class="dropdown-item" href="#" onclick="playlist(' + row.lng_cdr_id + ')"><i class="fa  fas fa-phone-square-alt"></i> Enqueue in Call Player</a></li>';
    }

    if (row.ysn_call_locked == -1) {
        contextmenu += '<li><a class="dropdown-item" href="#" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'ysn_call_locked\',0)"><i class="fa fa-unlock"></i><span> Deletion Unlock</span></a></li>';
    } else {
        contextmenu += '<li><a class="dropdown-item" href="#" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'ysn_call_locked\',-1)"><i class="fa fa-lock"></i><span> Deletion Lock</span></a></li>';
    }
    contextmenu += '<li><a class="dropdown-item" href="#" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'bit_deleted_marked\',1)"><i class="mdi mdi-delete-alert-outline"></i><span> Mark Deleted</span></a></li>';
    contextmenu += '<li class="dropdown dropend priority dropdown-submenu"> <a class="dropdown-item dropdown-toggle" href="javascript:void(0);" data-bs-toggle="dropdown"><i class="mdi mdi-menu-left"></i> Change Priority</a>\
              <ul class="dropdown-menu">\
                  <li class="'+ (row.int_call_priority_type==null?'active':'') +'"><a class="dropdown-item " href="#" id="none" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_priority_type\',null)"><i class="fas fa-flag text-warning"></i><span> None</span></a></li>\
                  <li class="'+ (row.int_call_priority_type == 2 ? 'active' : '') +'"><a class="dropdown-item " href="#" id="high" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_priority_type\',2)"><i class="fas fa-flag text-danger"></i><span> High</span></a></li>\
                  <li class="'+ (row.int_call_priority_type == 3 ? 'active' : '') +'"><a class="dropdown-item" href="#" id="normal" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_priority_type\',3)"><i class="fas fa-flag text-success"></i><span> Normal</span></a></li>\
                  <li class="'+ (row.int_call_priority_type == 4 ? 'active' : '') +'"><a class="dropdown-item " href="#" id="low" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_priority_type\',4)"><i class="fas fa-flag text-secondary"></i><span> Low</span></a></li>\
              </ul>\
          </li>';
    contextmenu += '<li class="dropdown dropend priority dropdown-submenu"> <a class="dropdown-item dropdown-toggle" href="javascript:void(0);" data-bs-toggle="dropdown"><i class="mdi mdi-menu-left"></i> Status</a>\
              <ul class="dropdown-menu">\
                  <li><a class="dropdown-item " href="#" id="high" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_status_type\',1)"><i class="mdi mdi-new-box"></i><span> New</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_status_type\',2)"><i class="mdi mdi-list-status"></i><span> Old</span></a></li>\
              </ul>\
          </li>';
    contextmenu += '<li class="dropdown dropend priority dropdown-submenu"> <a class="dropdown-item dropdown-toggle" href="javascript:void(0);" data-bs-toggle="dropdown"><i class="mdi mdi-menu-left"></i> Category</a>\
              <ul class="dropdown-menu">\
                  <li><a class="dropdown-item " href="#" id="high" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',0)"><i class="mdi mdi-set-none"></i><span> None</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',1001)"><i class="mdi mdi-bag-personal text-info"></i><span> Personal</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',1002)"><i class="mdi mdi-bag-personal-off text-success"></i><span> Important</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',1003)"><i class="mdi mdi-delete-clock text-orange-400"></i><span> Junk</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',1004)"><i class="mdi mdi-hot-tub text-danger"></i><span> Hot</span></a></li>\
                  <li><a class="dropdown-item" href="#" id="medium" onclick="actionOnCdr(' + row.lng_cdr_id + ',\'int_call_category_type\',1005)"><i class="mdi mdi-globe-model text-warning"></i><span> International</span></a></li>\
              </ul>\
          </li>';
        //   <li class=" disabled noevent"><a class="dropdown-item" href="#" id="markTranscription"><i class="far fa-file-alt"></i><span> Mark for Transcription </span></a></li>
    contextmenu += '<li><a class="dropdown-item" href="#" onclick="displayRemarksModal(' + row.lng_cdr_id +')"><i class="fa fa-edit"></i><span>Add/Edit Remarks</span></a></li>'
    // contextmenu += '<li><a class="dropdown-item" href="#" onclick="markRead(' + row.lng_cdr_id +')"><i class="fa fa-envelope-open"></i><span>Mark Read</span></a></li>';
    contextmenu += '</ul > ';
    $('.context-menu').html('').append(contextmenu);
    var elheight = $('.context-menu').children('.dropdown-menu').height();
    var winht = $(window).height();
    if ((elheight + top) > winht) {
        $('.context-menu').css({
            display: "block",
            position: "absolute",
            top: top - elheight - 60,
            left: left,
            "z-index": 9999
        });
        $('context-menu').children('.dropdown-menu').addClass('sbottom')
    } else {
        $('.context-menu').css({
            display: "block",
            position: "absolute",
            top: top,
            left: left,
            "z-index": 999
        });
        $('context-menu').children('.dropdown-menu').removeClass('sbottom');
    }
}
function actionOnCdr(id, col, val) {
    if (col == 'ysn_call_locked' || col == 'bit_deleted_marked') {
        Swal.fire({
            showCancelButton: true,
            cancelButtonColor: "#cb5858",
            confirmButtonColor: "#13b9cd",
            text: messageformate(col, val),
            title: "Are you sure ?",
            icon: "question",
        }).then((result) => {
            if (result.isConfirmed) {
                updatecdr(id, col, val);
                $('.context-menu').html('')
            } else {
                return false;
            }
        })
    } else {
        updatecdr(id, col, val);
        $('.context-menu').html('');
    }
    
}
function displayRemarksModal(id) {
    axios.post("/get-call-remarks/"+id, {
        lng_cdr_id: id
    }).then(function (response) {
        if (response.data.remarks) {
            $('#remarksbox').html("");
            $.each(response.data.remarks, function (i, item) {
                $('#remarksbox').append('<p class="mb-3"><b>' + moment(item.dat_remark).format('DD/DD/YYYY HH:mm')  +'</b> : ' + item.txt_remark +'</p>')
            });
            
        }
    });
    
    // var row = window.LaravelDataTables["cdr-table"].row($('#' + id)).data();
    $("#remarkmodal .modal-title").text("Remark [ CDR ID : " + id + " ]");
    // let d = document.createElement('div');
    // $(d).html(row.txt_remarks);
    // $("#remarkmodal #txt_remarks_mod").val($(d).html());
    // $(d).remove();
    $("#remarkmodal #modal_lng_cdr_id").val(id);
    $("#remarkmodal").modal('show');
}
function messageformate(col, val) {
    var msg = '';
    if (col == 'ysn_call_locked') {
        switch (val) {
            case -1:
                msg = 'You want to unlock this record for deletion.'
                break;
        
            default:
                msg = 'You want to lock this record from deletion.'
                break;
        }
    }
    if (col == 'bit_deleted_marked') {
        switch (val) {
            case 1:
                msg = 'You want to mark record as deleted.\nIt cannot be unmark for deleted.'
                break;

            default:
                msg = 'You want to lock this record from deletion.'
                break;
        }
    }
    return msg;
}
function responsemessageformate(col, val, response) {
    var msg = '';
    if (col == 'ysn_call_locked') {
        switch (val) {
            case -1:
                msg = 'Record is unlocked successfully'
                break;

            default:
                msg = 'Record is locked successfully'
                break;
        }
    }
    if (col == 'bit_deleted_marked') {
        switch (val) {
            case 1:
                msg = 'Record has marked as deleted.'
                break;

            default:
                msg = 'You want to lock this record from deletion.'
                break;
        }
    }
    return msg;
}
function alertpopup(id, col, val) {
    Swal.fire({
        showCancelButton: true,
        cancelButtonColor: "#cb5858",
        confirmButtonColor: "#13b9cd",
        text: messageformate(col, val),
        title: "Are you sure ?",
        icon: "question",
        // confirmButtonText: "Ko",
        // cancelButtonText: "@lang('translation.button.cancel')",
    }).then((result) => {
        if (result.isConfirmed) {
        } else {
            return false;
        }
    })
}
  
function responsemessage(col, val, response) {
    if (col == 'ysn_call_locked' || col == 'bit_deleted_marked') {
        Swal.fire(responsemessageformate(col, val, response), "", "success");
    }
}

let comman_filter = [];
let select_all = false;
function commanfilter() {
    if (comman_filter.length>0) {
        let cid = comman_filter[0].split(".").pop();
        $('.condition_value').find('#' + cid).val('');
        $('.condition_value').find('#' + cid + '_con').prop("selectedIndex", 0).trigger('change');
    }
    
    delete advance_filter[comman_filter[0]];
    delete search_filter[comman_filter[0]];


    let field = $('#m_filter_con_tn').val();
    let values = $('#m_filter_tn').val();
    let condtion = $('#m_filter_con_tn').children('option:selected').data('type');
    comman_filter = [field, values, condtion];
    if (field == 'none') {
        $('#m_filter_tn').val('');
        $('#m_filter_tn').attr("placeholder", "Target No./Name/Case Name");
    }
    if (field == 'lng_cdr_id') {
        $('#m_filter_tn').attr("placeholder", "Enter CDR ID, with comma(,) separated if multiple");
    }
    if (field == 'txt_target_number') {
        $('#m_filter_tn').attr("placeholder", "Enter Target number, with comma(,) separated if multiple");
    }
    if (field == 'target.txt_target_name') {
        $('#m_filter_tn').attr("placeholder", "Enter Target name");
    }
    if (field == 'target.cases.txt_name') {
        $('#m_filter_tn').attr("placeholder", "Enter Case name");
    }
    if (condtion && values && field) {
        // if (comman_filter) {
            let cid = comman_filter[0].split(".").pop();
            $('#' + cid).val(comman_filter[1]).trigger('change');
            $('#' + cid + '_con').val(comman_filter[2]).trigger('change');
        // }
        advance_filter[comman_filter[0]] = {
            'condition': comman_filter[2],
            'value': comman_filter[1],
            // field_b: field_b
        };
    } else {
        delete advance_filter[comman_filter[0]];
    }

}
function getselectedrows() {
    return window.LaravelDataTables["cdr-table"].column(0).checkboxes.selected().toArray();
}
function selecterows(a,b) {
    // console.log("Node",a)
    // console.log("selected",b)
}
function selectallrows(n, s, i) {
    // select_all = s;
    // console.log('node', n);
    // console.log('selections', s);
    // console.log('i', i);
    // console.log('select=>', select_all)
    // console.log(window.LaravelDataTables["cdr-table"].checkboxes({ selectAll :true}))
}
function drawCallback(s, j) {
}
function rowCallback(r, j) {
    // if (select_all) {
    //     $(r).find('input[type="checkbox"]').prop('checked', true); 
    // }
}
function stateLoadParams(s,d) {
    d.search.search = "";
    d.start = 0;
    d.scroller.topRow = 0;
    d.scroller.baseScrollTop = 0;
    d.scroller.scrollTop = 0;
    d.scroller.baseRowTop = 0;
}

function stateSaveCallback(oSettings, oData) {
    var data = JSON.stringify(oData);
    axios.post('/saveStates', {lng_layout_id:1,data: data }).then(function (response) {
        // console.log(response)
    }).catch(function (error) {
        console.log(error);
    });
}
async function stateLoadCallback(settings, callback) {
    var jsonData = {};
    await axios.post('/loadStates', { lng_layout_id: 1}).then(function (response) {
        let result = response.data;
        if (result != '') {
            var data = result;
            jsonData = data["strLayoutDetails"];
            if (jsonData) {
                jsonData = JSON.parse(jsonData);
                var datetime = new Date();
                jsonData.time = datetime.getTime();
                /* overriding default for paging and scrolling settings */
                jsonData.start = 0;
                jsonData.length = 72;
                if (jsonData.scroller) {
                    jsonData.scroller.topRow = 0;
                    jsonData.scroller.baseScrollTop = 0;
                    jsonData.scroller.baseRowTop = 0;
                }
            }
        }
    }).catch(function (error) {
        console.log(error);
    });
    callback(jsonData);
}
/**  **/
(function ($bs) {
    const CLASS_NAME = 'has-child-dropdown-show';
    $bs.Dropdown.prototype.toggle = function (_orginal) {
        return function () {
            document.querySelectorAll('.' + CLASS_NAME).forEach(function (e) {
                e.classList.remove(CLASS_NAME);
            });
            let dd = this._element.closest('.dropdown').parentNode.closest('.dropdown');
            for (; dd && dd !== document; dd = dd.parentNode.closest('.dropdown')) {
                dd.classList.add(CLASS_NAME);
            }
            return _orginal.call(this);
        }
    }($bs.Dropdown.prototype.toggle);

    document.querySelectorAll('.dropdown').forEach(function (dd) {
        dd.addEventListener('hide.bs.dropdown', function (e) {
            if (this.classList.contains(CLASS_NAME)) {
                this.classList.remove(CLASS_NAME);
                e.preventDefault();
            }
            e.stopPropagation(); // do not need pop in multi level mode
        });
    });

    
})(bootstrap);

$(document).ready(function (e) {
    $('#cdr-table').on('click', 'button', function (e) {
        var table = $('#cdr-table').DataTable();
        var row = table.row($(this).parents('tr')).data();
        var top = e.pageY + 20;
        var left = e.pageX - 200;
        createDropdownMenu(row, top, left);

    });
    $(document).on('click', function (event) {
        if (!$(event.target).closest(".btn_details").length && !$(event.target).closest(".dropdown-submenu").length) {
            $('.context-menu').html('');
        }
    });

    $("#cdr-table").on('dblclick', 'tbody tr', function () {
        callIdentification(window.LaravelDataTables["cdr-table"].row($(this)).data().lng_cdr_id)
    });
    
    $('body').on('click', '#remorksubmit', function () {
        let val = $("#remarkmodal #txt_remarks_mod").val();
        if (val == '') {
            Swal.fire('Please enter duration!', "", "info");
            return false;
        }
        updatecdr($('#modal_lng_cdr_id').val(), 'txt_remarks', $("#remarkmodal #txt_remarks_mod").val());
    });
    $('body').on('change', '#select_all', function () {
        console.log("A")
        if ($(this).is(':checked')) {
            select_all = true;
        } else {
            select_all = false;
        }
    })
})