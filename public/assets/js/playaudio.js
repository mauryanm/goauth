var pasteEnable = false;
var pasteAtTime = null;
var pastebuffer = null;
var pasteDuration = null;
var insertSilenceAtTime = null;
var wavesurfer;
var bvalshift = false;
var selectionfound = false;
var quill = null;
var zoomLavel = 5;
var zoomInit = 0;
var amplifyLavel = 5;
var amplifyInit = 0;
var regPlayLoop = true;
var playNextPrev = false;
var playReady = false;
var prevRow, nextRow;
var isCtrl = false;
var buttons = {};
var markedRead = true;
var playfrom = false;
var soundtouchNode = null;


function initTranscriptionControl(permissions) {
    if (preparePermission(permissions, 'edit-transcription')) {

        CKEDITOR.config.font_defaultLabel = 'Arial';
        CKEDITOR.config.fontSize_defaultLabel = '12';
        var editor = CKEDITOR.replace('transcription_text',
            {
                resize_enabled: false,
                extraPlugins: 'uicolor',
                extraPlugins: 'colordialog',
                height: '100%',
                toolbar:
                    [
                        ['Font'], ['FontSize'], ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'], ['Bold', 'Italic', 'Underline',], ['NumberedList', 'BulletedList'], ['TextColor', 'BGColor']
                    ],
                font_names: 'Arial;Sans Serif;Times New Roman;Calibri;Kruti Dev;',
            });
        $('.transSave').removeClass('d-none');
    } else {
        var editor = CKEDITOR.replace('transcription_text',
            {
                extraPlugins: 'uicolor',
                extraPlugins: 'colordialog',
                height: '100%',
                toolbar:
                    [
                        ['Font'], ['FontSize'], ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'], ['Bold', 'Italic', 'Underline',], ['NumberedList', 'BulletedList'], ['TextColor', 'BGColor']
                    ],
                font_names: 'Arial;Sans Serif;Times New Roman;Calibri;Kruti Dev;',
                readOnly: true,
            });
        $('.transSave').addClass('d-none');
    }
    if (editor) {

        editor.on('contentDom', function (evt) {
            editor.document.on('keyup', function (event) {
                if (event.data.$.keyCode == 17) isCtrl = true;
                try {
                    if (event.data.$.keyCode == 38 && isCtrl == true)
                        playNextPrevFileModal('prev');

                    if (event.data.$.keyCode == 40 && isCtrl == true)
                        playNextPrevFileModal('next');

                    event.data.$.preventDefault();
                } catch (err) { }

                if (event.data.$.keyCode == 17) isCtrl = false;
            });

            editor.document.on('keydown', function (event) {
                if (event.data.$.keyCode == 17) isCtrl = true;
                if (isCtrl == true) {
                    var map = {
                        32: 'play',       // space
                        37: 'back',       // left
                        39: 'forth',      // right
                        77: 'toggle-mute',
                        174: 'volume-down',
                        175: 'volume-up'

                    };
                    //The preventDefault() call prevents the browser's save popup to appear.
                    //The try statement fixes a weird IE error.
                    try {
                        //event.data.$.preventDefault();
                    } catch (err) { }
                    if ((event.data.$.keyCode in map)) {
                        var handler = eventHandlers[map[event.data.$.keyCode]];
                        event.data.$.preventDefault();
                        event.data.$.stopImmediatePropagation();
                        handler && handler(event);
                    }
                    //Call to your save function

                    //return true;
                }
            });

        }, editor.element.$);
    }
}
function createPlayControl(filename, trans_required, cdrId, tabId, readStatus, permissions, playfrom) {
    $("#play-file button.close").data('id', tabId);
    $("#play-file button.minmax").data('id', tabId);
    playfrom = playfrom;
    playNextPrev = true;
    if (readStatus) {
        markedRead = false;
    } else {
        markedRead = true;
    }
    //event.stopImmediatePropagation();
    /*
        Change show hide edit and complete transcription on the basis of permission
        If transcription is complete then button will show if user has prepare-message permission		
    */
    $('#stButton').hide();
    $('#completeTrans').hide();
    if (parseInt(trans_required) == 1) {
        if (preparePermission(permissions, 'edit-transcription')) {
            $('#stButton').show();
        }
        if (preparePermission(permissions, 'complete-transcription')) {
            $('#completeTrans').show();
        }
    }
    if (parseInt(trans_required) == 2) {
        if (preparePermission(permissions, 'prepare-message')) {
            if (preparePermission(permissions, 'edit-transcription')) {
                $('#stButton').show();
            }
            if (preparePermission(permissions, 'complete-transcription')) {
                $('#completeTrans').show();
            }
        }

    }
    // end of show hide transcription button
    if (parseInt(trans_required) > 0 && preparePermission(permissions, 'view-transcription')) {

        $("#toolbar-container").attr("style", "display:block");
        $(".waveFormWarp").attr("style", "flex: 0 0 60%;max-width: 60%;");
        $(".markTrancription").attr("style", "display:flex;flex: 0 0 40%;max-width: 40%;");
        $("#snow-container").attr("style", "display:block");
        //if(preparePermission(permissions,'edit-transcription')){
        initTranscriptionControl(permissions);
        //}

    }
    else {
        $("#toolbar-container, .markTrancription").attr("style", "display:none !important");
        $("#snow-container").attr("style", "display:none");
        $(".waveFormWarp").attr("style", "flex: 0 0 100%;max-width: 100%;");
    }

    var docheight = $(window).height();
    var docwidth = $(window).width();

    $('.play-file-modal-dialog').width(docwidth - 500);

    wavesurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        splitChannels: true,
        waveColor: '#1CF0AB',
        progressColor: 'transparent',
        backend: 'WebAudio',
        mediaType: 'audio',
        hideScrollbar: false,
        height: 512,
        scrollParent: true,
        responsive: true,
        normalize: true,
        minPxPerSec: 1,
        forceDecode: true,
        fillParent: true,
        interact: true,
        pixelRatio: 1,
        barHeight: 1,
        partialRender: true,
        maxCanvasWidth: 4000,
        autoCenter: false,
        autoEnd: false,
        barGap: 5,
        plugins: [
            WaveSurfer.timeline.create({
                container: '#wave-timeline',
                formatTimeCallback: formatTimeCallback,
                timeInterval: timeInterval,
                primaryLabelInterval: primaryLabelInterval,
                secondaryLabelInterval: secondaryLabelInterval,
                primaryColor: 'blue',
                secondaryColor: 'red',
                primaryFontColor: 'blue',
                secondaryFontColor: 'red'

            }),
            WaveSurfer.regions.create({
            })
        ],

    });

    loadFile(filename);
    buttons = {
        play: document.getElementById("playbtn"),
        pause: document.getElementById("pausebtn"),
        stop: document.getElementById("stopbtn"),
        zoom: document.getElementById("zoombtn"),
        _zoom: document.getElementById("_zoombtn"),
        amplify: document.getElementById("amplifybtn"),
        _amplify: document.getElementById("_amplifybtn"),
        playloop: document.getElementById("playloopbtn"),
        ch_left_right: document.getElementById("ch_left_right"),
        auto_play: document.getElementById("auto_play"),

    };

    var timeContainer = document.querySelector('#audio-time');
    timeContainer.innerHTML = '<i class="fa fa-clock-o"></i> ';
    buttons._zoom.disabled = true;
    //buttons._amplify.disabled=true;
    buttons.stop.disabled = true;
    buttons.pause.disabled = true;
    buttons.play.disabled = false;

    var playPauseBtn = document.querySelector('[data-action="play"]');
    console.log(playPauseBtn)
    playPauseBtn.onclick = function () {
        console.log("akm")
        wavesurfer.play();
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            region.update({ resize: true, drag: false, loop: false });
        })

        document.getElementById("playbtn").disabled = true;
        document.getElementById("stopbtn").disabled = false;
        document.getElementById("pausebtn").disabled = false;
    };

    var stopBtn = document.querySelector('[data-action="stop"]');
    stopBtn.onclick = function () {

        wavesurfer.stop();
        soundtouchNode = null;
        document.getElementById("playbtn").disabled = false;
        document.getElementById("stopbtn").disabled = true;
        document.getElementById("pausebtn").disabled = true;
    };

    var pauseBtn = document.querySelector('[data-action="pause"]');
    pauseBtn.onclick = function () {

        wavesurfer.pause();
        document.getElementById("playbtn").disabled = false;
        document.getElementById("stopbtn").disabled = true;
        document.getElementById("pausebtn").disabled = true;
    };

    var forwardBtn = document.querySelector('[data-action="forward"]');
    forwardBtn.onclick = function () {

        wavesurfer.skipForward();
    };

    var backwordBtn = document.querySelector('[data-action="backward"]');
    backwordBtn.onclick = function () {

        wavesurfer.skipBackward();
    }
    buttons.ch_left_right.addEventListener("change", function (e) {
        volumeLeftRight();
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            regionLeftRight(region)
        });

    });
    function responsiveWave() {
        wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
        wavesurfer.drawBuffer();
    }
    window.addEventListener('resize', responsiveWave);

    // buttons.ch_right.addEventListener("click", function(e){
    // 	volumeLeftRight();
    // 	sepretChannel(1)
    // 	Object.keys(wavesurfer.regions.list).map(function(id) {
    // 		var region = wavesurfer.regions.list[id];
    // 		regionLeftRight(region)
    // 	});
    // });
    // var muteBtn  = document.querySelector('[data-action="mute"]');	

    // muteBtn.onclick = function(){

    // 	var muteStatus = wavesurfer.getMute();

    // 	if(muteStatus == false){
    // 		wavesurfer.setMute(true);
    // 		this.innerHTML= '<i class="fa fa-volume-mute"></i>';
    // 	}
    // 	else{

    // 		wavesurfer.setMute(false);
    // 		this.innerHTML= '<i class="fa fa-volume-up"></i>';
    // 	}
    // }


    // var insertsilenceBtn  = document.querySelector('[data-action="insertsilence"]');

    // insertsilenceBtn.onclick = function(){

    // 	if(insertSilenceAtTime != null)			
    // 	{			
    // 		var currentTime = wavesurfer.getCurrentTime();
    // 		var totalDuration = wavesurfer.getDuration();

    // 		var silence = 10;			

    // 		var duration = totalDuration + silence;

    // 		// create a new buffer to hold the new clip
    // 		var buffer = createBuffer(wavesurfer.backend.buffer, duration)

    // 		var newbuff = createBuffer(wavesurfer.backend.buffer, silence)
    // 		// copy
    // 		Insert_silence(wavesurfer.backend.buffer, buffer, duration, newbuff, silence);

    // 		// load the new buffer
    // 		wavesurfer.empty()

    // 		wavesurfer.loadDecodedBuffer(buffer);	

    // 		drawFilePeaks(currentTime, 1);
    // 		//var peaks = wavesurfer.backend.getPeaks(duration, 0);
    // 		//wavesurfer.drawer.drawPeaks(peaks, duration, 0, duration);	

    // 		updateTime();
    // 	}

    // 	insertSilenceAtTime = null;
    // }

    // var deleteBtn  = document.querySelector('[data-action="delete"]');

    // deleteBtn.onclick = function(){

    // 	Object.keys(wavesurfer.regions.list).map(function (id) {
    // 		var region = wavesurfer.regions.list[id];

    // 		if(region != undefined)
    // 		{					
    // 			if((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1)
    // 			{
    // 				var currentTime = wavesurfer.getCurrentTime();

    // 				// the clip we want to get		
    // 				var start = region.start; // get it with waversufer.getCurrentTime()
    // 				var end = region.end;

    // 				var totalDuration = wavesurfer.getDuration();

    // 				var dur = end - start;					

    // 				var duration = totalDuration - dur;					

    // 				// create a new buffer to hold the new clip
    // 				var buffernew = createBuffer(wavesurfer.backend.buffer, duration)
    // 				// copy
    // 				cutBuffer(wavesurfer.backend.buffer, start, end, buffernew, totalDuration)			

    // 				// load the new buffer
    // 				wavesurfer.empty()

    // 				wavesurfer.loadDecodedBuffer(buffernew);			

    // 				drawFilePeaks(currentTime, 1);
    // 				//var peaks = wavesurfer.backend.getPeaks(duration, 0);
    // 				//wavesurfer.drawer.drawPeaks(peaks, duration, 0, duration);	

    // 				updateTime();

    // 				selectionfound = false;
    // 			}
    // 		}
    // 	});	
    // }

    // var copyBtn  = document.querySelector('[data-action="copy"]');
    // copyBtn.onclick = function(e){

    // 	e.stopPropagation();
    // 	Object.keys(wavesurfer.regions.list).map(function(id) {		
    // 		var region = wavesurfer.regions.list[id];

    // 		if(region != undefined)
    // 		{					
    // 			if((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1)
    // 			{
    // 				// the clip we want to get		
    // 				var start = region.start; // get it with waversufer.getCurrentTime()
    // 				var end = region.end;
    // 				var duration = end - start;

    // 				// create a new buffer to hold the new clip
    // 				var buffer = createBuffer(wavesurfer.backend.buffer, duration)								

    // 				// copy
    // 				copyBuffer(wavesurfer.backend.buffer, start, end, buffer, 0)

    // 				pastebuffer = buffer;
    // 				pasteDuration = duration;

    // 				pasteEnable = true;	

    // 				selectionfound = false;					
    // 			}
    // 		}
    // 	});		
    // }

    // var cutBtn  = document.querySelector('[data-action="cut"]');
    // cutBtn.onclick = function(){

    // 	Object.keys(wavesurfer.regions.list).map(function(id) {
    // 		var region = wavesurfer.regions.list[id];

    // 		if(region != undefined)
    // 		{		

    // 			if((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1)
    // 			{
    // 				var currentTime = wavesurfer.getCurrentTime();
    // 				// the clip we want to get		
    // 				var start = region.start; // get it with waversufer.getCurrentTime()
    // 				var end = region.end;

    // 				var totalDuration = wavesurfer.getDuration();

    // 				var dur = end - start;					

    // 				var duration = totalDuration - dur;

    // 				var buffer = createBuffer(wavesurfer.backend.buffer, dur)

    // 				// copy
    // 				copyBuffer(wavesurfer.backend.buffer, start, end, buffer, 0)

    // 				pastebuffer = buffer;
    // 				pasteDuration = dur;

    // 				pasteEnable = true;	

    // 				// create a new buffer to hold the new clip
    // 				var buffernew = createBuffer(wavesurfer.backend.buffer, duration)
    // 				// copy
    // 				cutBuffer(wavesurfer.backend.buffer, start, end, buffernew, totalDuration)			

    // 				// load the new buffer
    // 				wavesurfer.empty()

    // 				wavesurfer.loadDecodedBuffer(buffernew);

    // 				drawFilePeaks(currentTime, 1);

    // 				//var peaks = wavesurfer.backend.getPeaks(duration, 0);
    // 				//wavesurfer.drawer.drawPeaks(peaks, duration, 0, duration);	

    // 				updateTime();

    // 				selectionfound = false;
    // 			}
    // 		}
    // 	});	
    // }

    // var pasteBtn  = document.querySelector('[data-action="paste"]');
    // pasteBtn.onclick = function(){

    // 	if(pasteAtTime != null)			
    // 	{			
    // 		var currentTime = wavesurfer.getCurrentTime();

    // 		var totalDuration = wavesurfer.getDuration();

    // 		var duration = totalDuration + pasteDuration;

    // 		// create a new buffer to hold the new clip
    // 		var buffer = createBuffer(wavesurfer.backend.buffer, duration)
    // 		// copy
    // 		pasteBuffer(wavesurfer.backend.buffer, buffer, duration, pastebuffer);

    // 		// load the new buffer
    // 		wavesurfer.empty()

    // 		wavesurfer.loadDecodedBuffer(buffer);		

    // 		drawFilePeaks(currentTime, 1);
    // 		//var peaks = wavesurfer.backend.getPeaks(duration, 0);
    // 		//wavesurfer.drawer.drawPeaks(peaks, duration, 0, duration);	

    // 		//wavesurfer.zoom(142);

    // 		updateTime();

    // 		selectionfound = false;
    // 	}

    // 	pastebuffer = null;
    // 	pasteDuration = null;

    // 	pasteEnable = false;	
    // }

    wavesurfer.on('audioprocess', function () {

        updateTime();
    });

    var amplifyBtn = document.querySelector('[data-action="amplify"]');
    amplifyBtn.onclick = function () {
        var ch = buttons.ch_left_right.value;
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];

            if (region != undefined) {
                if (wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                    buttons.stop.disabled = true;
                    buttons.pause.disabled = true;
                }
                if (amplifyInit < (Math.abs(amplifyLavel))) {
                    amplifyInit++;

                    if ((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1) {
                        var currentTime = wavesurfer.getCurrentTime();
                        // the clip we want to get		
                        var start = region.start; // get it with waversufer.getCurrentTime()
                        var end = region.end;

                        var totalDuration = wavesurfer.getDuration();

                        var dur = end - start;

                        //var buffer = createBuffer(wavesurfer.backend.buffer, totalDuration)
                        //var buffer = wavesurfer.backend.buffer

                        // copy
                        pasteAmplifiedBuffer(wavesurfer.backend.buffer, start, end, /*buffer,*/ totalDuration, 'amplifyin', ch);

                        //wavesurfer.empty()
                        wavesurfer.drawer.recenter(((region.start + region.end) / 2) / wavesurfer.getDuration());
                        // load the new buffer					
                        //wavesurfer.loadDecodedBuffer(wavesurfer.backend.buffer);		

                        drawFilePeaks(currentTime, 0);
                        //var peaks = wavesurfer.backend.getPeaks(totalDuration, 0);
                        //wavesurfer.drawer.drawPeaks(peaks, totalDuration, 0, totalDuration);

                        //	wavesurfer.addRegion({ start: start, end: end, color: 'rgb(0, 0, 255, 0.2)' });
                        //	this.wavesurfer.fireEvent('region-update-end', this);
                        //wavesurfer.zoom(142);			
                        updateTime();
                        buttons.play.disabled = false;
                    } else {
                        console.log('Select more than 1 seconds audio')
                    }
                }
            }
        });

        if (amplifyInit >= amplifyLavel) {
            this.disabled = true;
        } else {
            buttons._amplify.disabled = false;
        }
    }
    buttons._amplify.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            var ch = buttons.ch_left_right.value;
            if (region != undefined) {
                if (wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                    buttons.stop.disabled = true;
                    buttons.pause.disabled = true;
                }
                if (amplifyInit > (-Math.abs(amplifyLavel))) {
                    amplifyInit--;

                    if ((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1) {
                        var currentTime = wavesurfer.getCurrentTime();
                        // the clip we want to get		
                        var start = region.start; // get it with waversufer.getCurrentTime()
                        var end = region.end;

                        var totalDuration = wavesurfer.getDuration();

                        var dur = end - start;

                        //var buffer = createBuffer(wavesurfer.backend.buffer, totalDuration)
                        //var buffer = wavesurfer.backend.buffer

                        // copy
                        pasteAmplifiedBuffer(wavesurfer.backend.buffer, start, end, /*buffer,*/ totalDuration, 'amplifyout', ch);

                        //wavesurfer.empty()
                        wavesurfer.drawer.recenter(((region.start + region.end) / 2) / wavesurfer.getDuration());
                        // load the new buffer					
                        //wavesurfer.loadDecodedBuffer(wavesurfer.backend.buffer);		

                        drawFilePeaks(currentTime, 0);
                        //var peaks = wavesurfer.backend.getPeaks(totalDuration, 0);
                        //wavesurfer.drawer.drawPeaks(peaks, totalDuration, 0, totalDuration);

                        //	wavesurfer.addRegion({ start: start, end: end, color: 'rgb(0, 0, 255, 0.2)' });
                        //	this.wavesurfer.fireEvent('region-update-end', this);
                        //wavesurfer.zoom(142);			
                        updateTime();
                        buttons.play.disabled = false;
                    } else {
                        console.log('Select more than 1 seconds audio')
                    }
                }
            }
        });
        if (amplifyInit <= (-Math.abs(amplifyLavel))) {
            this.disabled = true;
        } else {
            buttons.amplify.disabled = false;
        }
        // Enable/Disable respectively buttons
    }, false);
    // var speedBtn  = document.querySelector('[data-action="speed"]');

    // speedBtn.oninput = function (e) {
    // 	wavesurfer.setPlaybackRate(Number(this.value)/100);
    // 	sliderMarker(this,speedoutput);
    // };

    $('#speedbtn a').on('click', function (e) {
        var speedval = $(this).data('value');
        volumeLeftRight();
        $('#showspeedbtn').text($(this).text());
        wavesurfer.setPlaybackRate(Number(speedval) / 100);
    })
    // var zoomBtn  = document.querySelector('[data-action="zoom"]');

    // zoomBtn.oninput = function () {
    // 			var wcontainerWidth=wavesurfer.drawer.container.clientWidth;
    // 			var soundDuration=parseInt(wavesurfer.getDuration());
    // 			//if(soundDuration<wcontainerWidth){
    // 			var sdRatio=wcontainerWidth/soundDuration;
    // 				sdRatio=parseInt(sdRatio);

    // 	wavesurfer.zoom(Number(sdRatio*(Math.pow(2, this.value))));
    // 	wavesurfer.params.barHeight=1
    // 	sliderMarker(this,zoomoutput);		
    // };
    buttons.zoom.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        var width = parseInt(wavesurfer.drawer.container.clientWidth);
        var AudioLength = wavesurfer.getDuration();
        var zmPxPerSec = (width / AudioLength);
        if (zoomInit < zoomLavel) {
            zoomInit++;
            wavesurfer.zoom(Number(zmPxPerSec * (Math.pow(2, zoomInit))));
        }
        if (zoomInit >= zoomLavel) {
            this.disabled = true;
        } else {
            buttons._zoom.disabled = false;
        }
        // Enable/Disable respectively buttons
        setHeightofwarp();
    }, false);
    buttons._zoom.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        var width = parseInt(wavesurfer.drawer.container.clientWidth);
        var AudioLength = wavesurfer.getDuration();
        var zmPxPerSec = (width / AudioLength);
        if (zoomInit > 0) {
            zoomInit--;
            wavesurfer.zoom(Number(zmPxPerSec * (Math.pow(2, zoomInit))));
        }
        if (zoomInit <= 0) {
            this.disabled = true;
        } else {
            buttons.zoom.disabled = false;
        }
        setHeightofwarp();
        // Enable/Disable respectively buttons
    }, false);
    var volumnBtn = document.querySelector('[data-action="volumn"]');
    volumnBtn.oninput = function () {
        wavesurfer.setVolume(Number(this.value));
        sliderMarker(this, volumnoutput);
    };

    // var playloopBtn  = document.querySelector('[data-action="playloop"]');
    // playloopBtn.onclick = function () {

    // 	Object.keys(wavesurfer.regions.list).forEach(function (id) {
    //            var region = wavesurfer.regions.list[id];

    //            if (document.getElementById('playloop').checked) 
    // 		{						
    // 			if((Math.round(region.end * 10) - Math.round(region.start * 10)) <= 1)
    // 			{
    // 				region.update({ resize: false , drag: true, loop:false });
    // 			}
    // 			else
    // 			{
    // 				region.update({ resize: true , drag: false, loop:true });		
    // 			}
    // 		}
    // 		else
    // 		{
    // 			region.update({ resize: false , drag: false, loop:false });			
    // 		}
    //        });
    // }

    buttons.playloop.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        Object.keys(wavesurfer.regions.list).forEach(function (id) {
            var region = wavesurfer.regions.list[id];
            //if(regPlayLoop){
            if ((Math.round(region.end * 10) - Math.round(region.start * 10)) <= 1) {
                regPlayLoop = true;
                region.update({ resize: false, drag: true, loop: false });

            }
            else {
                var playend = Math.min(region.end, wavesurfer.getCurrentTime(), region.start)
                wavesurfer.play(Math.max(region.start, playend));
                region.update({ resize: true, drag: false, loop: true });
                regPlayLoop = false;
                //buttons.playloop.disabled=true;
                buttons.stop.disabled = false;
                buttons.pause.disabled = false;
                buttons.play.disabled = false;
            }
            //          }
            //          else
            // {
            // 	regPlayLoop=true;
            // 	region.update({ resize: false , drag: false, loop:false });
            // }
        });
    }, false);
    wavesurfer.on('ready', function () {
        playReady = true;
        zoomInit = 0;
        buttons._zoom.disabled = true;
        //buttons._amplify.disabled=true;
        buttons.zoom.disabled = false;
        wavesurfer.clearRegions();
        //wavesurfer.disableDragSelection();
        wavesurfer.enableDragSelection({
            color: randomColor(0.2),
            drag: true,
            resize: true,
        });
        setControlHeight();
        //selectionfound=false;
        updateTime();
        var st = new window.soundtouch.SoundTouch(
            wavesurfer.backend.ac.sampleRate
        );
        var buffer = wavesurfer.backend.buffer;
        var achannels = buffer.numberOfChannels;
        var l = buffer.getChannelData(0);
        var r = achannels > 1 ? buffer.getChannelData(1) : l;
        var length = buffer.length;
        var seekingPos = null;
        var seekingDiff = 0;
        var source = {
            extract: function (target, numFrames, position) {
                if (seekingPos != null) {
                    seekingDiff = seekingPos - position;
                    seekingPos = null;
                }

                position += seekingDiff;

                for (var i = 0; i < numFrames; i++) {
                    target[i * 2] = l[i + position];
                    target[i * 2 + 1] = r[i + position];
                }

                return Math.min(numFrames, length - position);
            }
        };

        wavesurfer.panner = wavesurfer.backend.ac.createPanner();
        wavesurfer.on('play', function () {
            if (!readStatus && markedRead) {
                updateReadStatus(cdrId, tabId);
                markedRead = false;
            }
            seekingPos = ~~(wavesurfer.backend.getPlayedPercents() * length);
            st.tempo = wavesurfer.getPlaybackRate();

            if (st.tempo === 1) {
                //wavesurfer.backend.disconnectFilters();
                wavesurfer.backend.setFilter(wavesurfer.panner);
            } else {
                if (!soundtouchNode) {
                    var filter = new window.soundtouch.SimpleFilter(source, st);
                    soundtouchNode = window.soundtouch.getWebAudioNode(
                        wavesurfer.backend.ac,
                        filter,
                    );
                }
                //wavesurfer.panner.connect(soundtouchNode);
                wavesurfer.backend.setFilters([soundtouchNode, wavesurfer.panner]);
            }
        });

        wavesurfer.on('pause', function () {
            soundtouchNode && soundtouchNode.disconnect();
        });

        wavesurfer.on('seek', function () {
            seekingPos = ~~(wavesurfer.backend.getPlayedPercents() * length);
        });
        nextRow = getvoicefaxrow(cdrId, tabId, 'next');
        prevRow = getvoicefaxrow(cdrId, tabId, 'prev');
        if (playfrom) {
            document.getElementById('nextbtn').style.display = 'none';
            document.getElementById('prevbtn').style.display = 'none';
        } else {
            document.getElementById('nextbtn').style.display = 'block';
            document.getElementById('prevbtn').style.display = 'block';
            if (nextRow) {
                document.getElementById('nextbtn').disabled = false;
            } else {
                document.getElementById('nextbtn').disabled = true;
            }
            if (prevRow) {
                document.getElementById('prevbtn').disabled = false;
            } else {
                document.getElementById('prevbtn').disabled = true;
            }
        }
        var waveLength = $('#waveform>wave').length;
        if (waveLength > 1) {
            $('#waveform>wave').eq(0).remove();
        }
        $('.modal_loader').hide();
        wavesurfer.setVolume(Number(document.querySelector('[data-action="volumn"]').value));
        if (wavesurfer.backend.buffer.numberOfChannels == 1) {
            buttons.ch_left_right.disabled = true;
        } else {
            buttons.ch_left_right.disabled = false;
        }
        var waveformover = $('.waveform_over').length
        if (waveformover == 0) {
            $('#waveform').append('<div class="waveform_over"></div>')
        }
        if (auto_play.checked) {
            playAudio(wavesurfer, buttons);
        }
    });
    wavesurfer.on('interaction', function () {
        volumeLeftRight();
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            regionLeftRight(region)
        });
    })
    // wavesurfer.zoom(142);
    wavesurfer.on('finish', function () {
        wavesurfer.stop();
        soundtouchNode = null;
        document.getElementById("playbtn").disabled = false;
        document.getElementById("stopbtn").disabled = true;
        document.getElementById("pausebtn").disabled = true;
        // if(auto_play.checked){
        // 	playNextPrevFileModal('next'); // Use if need to paly next after finish current 
        // }
    });

    // wavesurfer.on('loading', function(e){
    // 	if(e==100){
    // 		if (navigator.userAgent.indexOf("Firefox") > 0) {
    // 			var setTime=600;
    // 		}else{
    // 			var setTime=300;
    // 		}
    // 		setTimeout(function(){
    // 			var wcontainerWidth=wavesurfer.drawer.container.clientWidth;
    // 			var soundDuration=parseInt(wavesurfer.getDuration());
    // 			var sdRatio=parseInt(wcontainerWidth/soundDuration);
    // 			var wavdwht=$('.waveFormWarp').height();
    // 			$('.ql-editor').css({'max-height':'500px'})

    // 			//wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
    // 			wavesurfer.zoom(sdRatio);
    // 			//wavesurfer.drawBuffer();
    // 		},setTime);
    // 	}
    // })

    document.addEventListener('keydown', function (e) {
        e.stopImmediatePropagation();
        var map = {
            32: 'play',       // space
            37: 'back',       // left
            39: 'forth',      // right
            77: 'toggle-mute',
            174: 'volume-down',
            175: 'volume-up'

        };
        //(e.metaKey || e.ctrlKey)
        if ((e.metaKey || e.ctrlKey) && (e.which in map)) {
            var handler = eventHandlers[map[e.which]];
            e.preventDefault();
            e.stopImmediatePropagation();
            handler && handler(e);
        }
    });
    // document.onkeyup = function(e) {
    //        if ((e.metaKey || e.ctrlKey) && e.which ==38 && playNextPrev && playReady && !playfrom) {
    //         	e.stopImmediatePropagation();
    //            playNextPrevFileModal('prev');
    //            playReady = false;
    //            if(!prevRow) playReady=true;
    //        }
    //        if ((e.metaKey || e.ctrlKey) && e.which ==40 && playNextPrev && playReady && !playfrom) {
    //         	e.stopImmediatePropagation();
    //            playNextPrevFileModal('next');
    //            playReady = false;
    //            if(!nextRow) playReady=true;
    //        }

    //    };

    // document.onkeyup = function(e) {
    //   if (e.which == 77) {
    //     alert("M key was pressed");
    //   } else if (e.ctrlKey && e.which == 32) {
    //     alert("Ctrl + space shortcut combination was pressed");
    //   } else if (e.ctrlKey && e.altKey && e.which == 89) {
    //     alert("Ctrl + Alt + Y shortcut combination was pressed");
    //   } else if (e.ctrlKey && e.altKey && e.shiftKey && e.which == 85) {
    //     alert("Ctrl + Alt + Shift + U shortcut combination was pressed");
    //   }
    // };


    // 	var zom=1;
    // 	$('#waveform').bind('mousewheel DOMMouseScroll', function(e){
    // 	var container = $(wavesurfer.drawer)
    // 	var wcontainerWidth=wavesurfer.drawer.container.clientWidth;
    // 	var soundDuration=parseInt(wavesurfer.getDuration());
    // 	var zoomPerSec=parseInt(wcontainerWidth/soundDuration);
    // 	console.log(zoomPerSec)
    // 	if (!container.is(e.target) && container.has(e.target).length === 0) 
    //       {
    // 	    if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
    // 	        //if(zoomPerSec<=10000){
    // 	        	zom=zoomPerSec*2;
    // 	    	//}
    // 	    }
    // 	    else {
    // 	    	if(zoomPerSec>0){
    // 	    	zoomPerSec=zoomPerSec/2;
    // 	    	setTimeout(function(){
    // 	    		wavesurfer.zoom(Number(zoomPerSec+1));
    // 	    	},50)
    // 	    	}
    // 	    }
    // 	    // var zoomsl=document.querySelector('[data-action="zoom"]');
    // 	    // zoomsl.value=zoomPerSec;
    // 	    // zoomsl.max=5000;
    // 	    sliderMarker(zoomsl,zoomoutput);	
    // 	     wavesurfer.zoom(Number(zoomPerSec));
    // }
    // console.log(wcontainerWidth, soundDuration);
    // });

    wavesurfer.on('region-click', editAnnotation);
    //wavesurfer.on('region-click', regionisClicked);
    wavesurfer.on('region-updated', saveRegions);
    wavesurfer.on('region-created', regionCreated);
    wavesurfer.on('region-update-end', settingRegions);

    wavesurfer.on('region-removed', saveRegions);
    // wavesurfer.on('region-in', showNote);	

    wavesurfer.on('region-play', function (region) {
        region.once('out', function () {
            wavesurfer.play(region.start);
            wavesurfer.pause();
        });
    });

    // var deleteselectionBtn  = document.querySelector('[data-action="delete-region"]');
    // deleteselectionBtn.onclick = function () {
    // 	var form = document.forms.edit;
    // 	var regionId = form.dataset.region;
    // 	if (regionId) {
    // 		var region = wavesurfer.regions.list[regionId];
    // 		if((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1)
    // 		{
    // 			selectionfound = false;
    // 		}
    // 		wavesurfer.regions.list[regionId].remove();			
    // 		form.reset();
    // 	}

    // 	saveRegions();
    // };	


    // var saveselectionBtn  = document.querySelector('[data-action="save-region"]');
    // saveselectionBtn.onclick = function () {
    // 	saveRegions();
    // }
    function removeRegion(region) {
        region.remove();
        amplifyInit = 0;
        buttons.amplify.disabled = false;
        buttons._amplify.disabled = false;
    }
    function regionisClicked() {
        //vconsole.log('sdfsfsf')

    }
    function settingRegions(regn) {
        //console.log(regn)
        //////////////////////////////////////////////////

        var count = 0;
        var regionlist = [];


        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            if ((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1) {
                count++;
                regionlist.push(id);
            }
            else {
                //region.update({ resize: false , drag: true, loop:false });
                //region.remove();
                removeRegion(region);
                selectionfound = false;
            }


            /////////////////////////////////////////////////
            if (!region.hasDeleteButton) {
                var regionEl = region.element;

                var deleteButton = regionEl.appendChild(document.createElement('deleteButton'));
                deleteButton.className = 'fa fa-trash-alt';

                deleteButton.addEventListener('click', function (e) {
                    region.remove();
                });

                deleteButton.title = "Delete region";

                var css = {
                    display: 'block',
                    float: 'right',
                    padding: '1px',
                    position: 'relative',
                    zIndex: 10,
                    cursor: 'pointer',
                    cursor: 'hand',
                    color: '#dc3545',
                    marginTop: '7px',
                    marginRight: '5px',
                };

                region.style(deleteButton, css);
                region.hasDeleteButton = true;
            }

            ////////////////////////////////////////////////
        });
        if (regionlist.length > 1) {
            for (var i = 1; i < regionlist.length; i++) {
                wavesurfer.regions.list[regionlist[i]].remove();
            }

        }
    }

    function saveRegions(regn) {
        regionLeftRight(regn)
        //localStorage.regions = JSON.stringify(

        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];

            if ((Math.round(region.end * 10) - Math.round(region.start * 10)) <= 1) {
                return {
                    start: region.start,
                    end: region.end,
                    attributes: region.attributes,
                    data: region.data,
                    drag: true,
                    resize: false
                };
            }

            /*else
            {
                return {						
                    start: region.start,
                    end: region.end,
                    attributes: region.attributes,
                    data: "selection"	,
                    drag:false,
                    resize:true						
                };
            }*/
        })
        //);

        //writefiletoserver();
    }
    function regionCreated(regn) {
        regionLeftRight(regn);
    }
    function regionLeftRight(region) {
        if (wavesurfer.backend.buffer.numberOfChannels == 2) {
            if (!region.element) {
                return false
            }
            setTimeout(function () {
                if (buttons.ch_left_right.value == 1) {
                    region.style(region.element, { height: '50%', top: '0px' });
                } else if (buttons.ch_left_right.value == 2) {
                    region.style(region.element, { height: '50%', top: '50%' });
                } else {
                    region.style(region.element, { height: '100%', top: '0px' });
                }
            }, 5)
        }
    }

    function volumeLeftRight() {
        if (wavesurfer.backend.buffer.numberOfChannels == 2) {
            setTimeout(function () {
                // const splitter = wavesurfer.backend.ac.createChannelSplitter(2);
                // const merger = wavesurfer.backend.ac.createChannelMerger(2);
                // const leftGain = wavesurfer.backend.ac.createGain();
                // const rightGain = wavesurfer.backend.ac.createGain();
                // // Here is where the wavesurfer and web audio combine.
                // splitter.connect(leftGain, 0);
                // splitter.connect(rightGain, 1);
                // leftGain.connect(merger, 0, 0);
                // rightGain.connect(merger, 0, 1);
                // wavesurfer.backend.setFilters([splitter, leftGain, merger]);
                // if(buttons.ch_left_right.value==0){
                // 	leftGain.gain.value=wavesurfer.getVolume();
                // 	$('.waveform_over').css({'display':'block', 'top':'calc(50% + 1px)','height':'50%'})
                // 	rightGain.gain.value=0;
                // }else if(buttons.ch_left_right.value==1){
                // 	rightGain.gain.value=wavesurfer.getVolume();
                // 	$('.waveform_over').css({'display':'block', 'top':'0%','height':'50%'})
                // 	leftGain.gain.value=0;
                // }else{
                // 	leftGain.gain.value=wavesurfer.getVolume();
                // 	rightGain.gain.value=wavesurfer.getVolume();
                // 	$('.waveform_over').css({'display':'none', 'top':'-99999px','height':0})
                // }
                // setHeightofwarp();
                if (buttons.ch_left_right.value == 1) {
                    $('.waveform_over').css({ 'display': 'block', 'top': 'calc(50% + 1px)', 'height': '50%' });
                    //wavesurfer.panner.setPosition(-1, 0, 0);
                    leftRightchannel();
                } else if (buttons.ch_left_right.value == 2) {
                    $('.waveform_over').css({ 'display': 'block', 'top': '0%', 'height': '50%' });
                    //wavesurfer.panner.setPosition(1, 0, 0);
                    leftRightchannel();
                } else {
                    //wavesurfer.panner.setPosition(0, 0, 0);
                    //soundtouchNode=null;
                    leftRightchannel();
                    $('.waveform_over').css({ 'display': 'none', 'top': '-99999px', 'height': 0 })
                }
                setHeightofwarp();
            }, 10)

        }
    }
    function leftRightchannel() {
        const splitter = wavesurfer.backend.ac.createChannelSplitter(2);
        const merger = wavesurfer.backend.ac.createChannelMerger(2);
        const leftGain = wavesurfer.backend.ac.createGain();
        const rightGain = wavesurfer.backend.ac.createGain();
        // Here is where the wavesurfer and web audio combine.
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        if (soundtouchNode) {
            wavesurfer.backend.setFilters([soundtouchNode, splitter, leftGain, merger]);
        } else {
            wavesurfer.backend.setFilters([splitter, leftGain, merger]);
        }

        if (buttons.ch_left_right.value == 1) {
            leftGain.gain.value = wavesurfer.getVolume();
            $('.waveform_over').css({ 'display': 'block', 'top': 'calc(50% + 1px)', 'height': '50%' })
            rightGain.gain.value = 0;
        } else if (buttons.ch_left_right.value == 2) {
            rightGain.gain.value = wavesurfer.getVolume();
            $('.waveform_over').css({ 'display': 'block', 'top': '0%', 'height': '50%' })
            leftGain.gain.value = 0;
        } else {
            leftGain.gain.value = wavesurfer.getVolume();
            rightGain.gain.value = wavesurfer.getVolume();
            $('.waveform_over').css({ 'display': 'none', 'top': '-99999px', 'height': 0 })
        }
    }
    function setHeightofwarp() {
        var conWidth = wavesurfer.drawer.container.clientWidth;
        var waveWidth = Math.round(wavesurfer.getDuration() * wavesurfer.params.minPxPerSec * wavesurfer.params.pixelRatio);

        if (buttons.ch_left_right.value == 1 && conWidth < waveWidth) {
            $('.waveform_over').css({ 'top': 'calc(50% - 6px)', 'height': 'calc(50% - 8px)' })
        } else if (buttons.ch_left_right.value == 2 && conWidth < waveWidth) {
            $('.waveform_over').css({ 'top': '0%', 'height': 'calc(50% - 8px)' })
        } else {
            //$('.waveform_over').css({'top':'-99999px','height':'calc(50% - 1px)'})
        }

        if (buttons.ch_left_right.value == 1 && conWidth > waveWidth) {
            $('.waveform_over').css({ 'top': 'calc(50% + 1px)', 'height': 'calc(50% - 1px)' })
        } else if (buttons.ch_left_right.value == 2 && conWidth > waveWidth) {
            $('.waveform_over').css({ 'top': '0%', 'height': 'calc(50% - 1px)' })
        } else {
            //$('.waveform_over').css({'top':'-99999px','height':'calc(50% - 1px)'})
        }

    }
    function sepretChannel(ch = 3) {
        // console.log('akm')
        // wavesurfer.setWaveColor('#efefef');
        // wavesurfer.drawBuffer();
        // var buffer=wavesurfer.backend.buffer;
        // var duration=wavesurfer.getDuration();
        // var toBuffer = createBuffer(wavesurfer.backend.buffer, duration);
        // var sampleRate = buffer.sampleRate
        // var frameCount = duration * sampleRate
        // for (var i = 0; i < buffer.numberOfChannels; i++) {

        // 	var fromChanData = buffer.getChannelData(i)
        // 	var toChanData = toBuffer.getChannelData(i);
        // 	console.log(fromChanData)

        // 	for (var j = 0; j < frameCount; j++) {
        // 	   if(i==ch || ch>4)
        // 	   {
        // 	   	toChanData[j] = fromChanData[j];

        // 		   continue;
        // 	   }

        // 	  toChanData[j] = fromChanData[j];				 		  
        // 	}
        // }		
    }
    $('#waveform').on('mousedown', function (e) {
        e.stopImmediatePropagation();
        bvalshift = e.shiftKey
        Object.keys(wavesurfer.regions.list).forEach(function (id) {

            var region = wavesurfer.regions.list[id];

            if ((Math.round(region.end * 10) - Math.round(region.start * 10)) > 1) {
                selectionfound = true;
                wavesurfer.disableDragSelection();
            }
        });
        //console.log(selectionfound);

        if (!selectionfound) {
            wavesurfer.enableDragSelection({
                color: randomColor(0.2),
                drag: true,
                resize: true,
            });
        } else {/*
			Object.keys(wavesurfer.regions.list).forEach(function (id) {
			
			var region = wavesurfer.regions.list[id];
				if(!wavesurfer.isPlaying()){
				region.remove();
				selectionfound = false;
				wavesurfer.enableDragSelection({		
					color: randomColor(0.2),
					drag: true,
					resize: true,
				});
			}
		});
			
		*/}

    });
    wavesurfer.drawer.on('click', function (e) {
        if (selectionfound) {
            Object.keys(wavesurfer.regions.list).forEach(function (id) {
                var region = wavesurfer.regions.list[id];
                if (!wavesurfer.isPlaying()) {
                    //region.remove();
                    removeRegion(region);
                    selectionfound = false;
                    wavesurfer.enableDragSelection({
                        color: randomColor(0.2),
                        drag: true,
                        resize: true,
                    });
                }
            });
        }
    })
    wavesurfer.on('seek', function (position) {

        if (bvalshift) {
            var currentTime = position * wavesurfer.getDuration();

            var region = wavesurfer.addRegion({ start: currentTime, end: currentTime + 0.1, color: 'rgb(255, 0, 0, 1)' });

            //editAnnotation(region);
            bvalshift = false;
            //saveRegions();
            this.wavesurfer.fireEvent('region-update-end', this);
        }

        if (pasteEnable) {
            pasteAtTime = position * wavesurfer.getDuration();
        }
        else {
            insertSilenceAtTime = position * wavesurfer.getDuration();
        }
    });
}

function editAnnotation(region) {
    if (!region.hasDeleteButton) {
        var regionEl = region.element;

        var deleteButton = regionEl.appendChild(document.createElement('deleteButton'));
        deleteButton.className = 'fa fa-trash-alt';

        deleteButton.addEventListener('click', function (e) {
            region.remove();
        });

        deleteButton.title = "Delete region";

        var css = {
            display: 'block',
            float: 'right',
            padding: '1px',
            position: 'relative',
            zIndex: 10,
            cursor: 'pointer',
            cursor: 'hand',
            color: '#dc3545',
            marginTop: '7px',
            marginRight: '5px',
        };

        region.style(deleteButton, css);
        region.hasDeleteButton = true;
    }
    // 	var form = document.forms.edit;	
    //     form.style.opacity = 1;
    //     form.elements.start.value = Math.round(region.start * 10) / 10,
    //     form.elements.end.value = Math.round(region.end * 10) / 10;	

    //     form.elements.note.value = region.data.note || '';
    //     form.onsubmit = function (e) {
    //         e.preventDefault();
    //         region.update({			
    //             start: form.elements.start.value,
    //             end: form.elements.end.value,
    //             data: {
    //                 note: form.elements.note.value
    //             }
    //         });

    //         form.style.opacity = 0;
    //     };
    //     form.onreset = function () {
    //         form.style.opacity = 0;
    //         form.dataset.region = null;
    //     };
    //     form.dataset.region = region.id;
}

/**
 * Display annotation.
 */
function showNote(region) {
    if (!showNote.el) {
        showNote.el = document.querySelector('#subtitle');
    }
    showNote.el.textContent = region.data.note || '-';
}
/**
 * Random RGBA color.
 */
function randomColor(alpha) {

    if (alpha == 0)
        return 'rgba(' + [~~(255), ~~(0), ~~(0), 1] + ')';

    return 'rgba(' + [~~(0), ~~(255), ~~(0), 0.2] + ')';
}

function loadFile(filename) {
    wavesurfer.load(filename);
}

function drawFilePeaks(currentTime, mode) {
    var nominalWidth = Math.round(wavesurfer.getDuration() * wavesurfer.params.minPxPerSec * wavesurfer.params.pixelRatio);
    var parentWidth = wavesurfer.drawer.getWidth();
    var width = nominalWidth;
    var start = wavesurfer.drawer.getScrollX();
    var end = Math.max(start + parentWidth, width); // Fill container

    wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
    if (wavesurfer.params.fillParent && (!wavesurfer.params.scrollParent || nominalWidth < parentWidth)) {
        width = parentWidth;
        start = 0;
        end = width;
    }

    var peaks;

    if (mode == 1) {
        /*if (wavesurfer.params.partialRender) {
            alert('hi');
            var newRanges = wavesurfer.peakCache.addRangeToPeakCache(width, start, end);
            var i;

            for (i = 0; i < newRanges.length; i++) {
              peaks = wavesurfer.backend.getPeaks(width, newRanges[i][0], newRanges[i][1]);
              wavesurfer.drawer.drawPeaks(peaks, width, newRanges[i][0], newRanges[i][1]);
            }
        	
      } 
      else {*/
        peaks = wavesurfer.backend.getPeaks(width, start, end);

        wavesurfer.drawer.drawPeaks(peaks, width, start, end);

        // }
    }
    else {
        peaks = wavesurfer.backend.getPeaks(width, start, end);

        wavesurfer.drawer.drawPeaks(peaks, width, start, end);
    }
    wavesurfer.fireEvent('redraw', peaks, width);
    wavesurfer.setCurrentTime(currentTime);
    setControlHeight();
}

function Insert_silence(fromBuffer, toBuffer, newDuration, newpastebuffer, silence) {
    var sampleRate = fromBuffer.sampleRate
    var frameCount = newDuration * sampleRate
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
        var fromChanData = fromBuffer.getChannelData(i)
        var toChanData = toBuffer.getChannelData(i);
        var newbuff = newpastebuffer.getChannelData(i);

        var f = Math.round(insertSilenceAtTime * sampleRate);
        var t = Math.round(silence * sampleRate);

        var j = 0;
        var l = 0;
        for (var k = 0; k < frameCount; k++) {
            if (k > f && l < t) {
                toChanData[k] = newbuff[l];
                l++;
                continue;
            }

            toChanData[k] = fromChanData[j];
            j++;
        }
    }
}

function createBuffer(originalBuffer, duration) {
    var sampleRate = originalBuffer.sampleRate
    var frameCount = duration * sampleRate
    var channels = originalBuffer.numberOfChannels
    return new AudioContext().createBuffer(channels, frameCount, sampleRate)
}

function copyBuffer(fromBuffer, fromStart, fromEnd, toBuffer, toStart) {
    var sampleRate = fromBuffer.sampleRate
    var frameCount = (fromEnd - fromStart) * sampleRate
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
        var fromChanData = fromBuffer.getChannelData(i)
        var toChanData = toBuffer.getChannelData(i)
        for (var j = 0, f = Math.round(fromStart * sampleRate), t = Math.round(toStart * sampleRate); j < frameCount; j++, f++, t++) {

            toChanData[t] = fromChanData[f]
        }
    }
}

function cutBuffer(fromBuffer, fromStart, fromEnd, toBuffer, newDuration) {
    var sampleRate = fromBuffer.sampleRate
    var frameCount = newDuration * sampleRate
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
        var fromChanData = fromBuffer.getChannelData(i)
        var toChanData = toBuffer.getChannelData(i);
        var f = Math.round(fromStart * sampleRate);
        var t = Math.round(fromEnd * sampleRate);
        var k = 0;
        for (var j = 0; j < frameCount; j++) {
            if (j > f && j < t)
                continue;

            toChanData[k] = fromChanData[j];
            k++;
        }
    }
}

function pasteBuffer(fromBuffer, toBuffer, newDuration, newpastebuffer) {
    var sampleRate = fromBuffer.sampleRate
    var frameCount = newDuration * sampleRate
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
        var fromChanData = fromBuffer.getChannelData(i)
        var toChanData = toBuffer.getChannelData(i);
        var newbuff = newpastebuffer.getChannelData(i);

        var f = Math.round(pasteAtTime * sampleRate);
        var t = Math.round(pasteDuration * sampleRate);

        var j = 0;
        var l = 0;
        for (var k = 0; k < frameCount; k++) {
            if (k > f && l < t) {
                toChanData[k] = newbuff[l];
                l++;
                continue;
            }

            toChanData[k] = fromChanData[j];
            j++;
        }
    }
}

function pasteAmplifiedBuffer(fromBuffer, fromStart, fromEnd, /*toBuffer,*/ duration, type, ch = 3) {
    ch = ch - 1;
    var sampleRate = fromBuffer.sampleRate
    var frameCount = duration * sampleRate
    // 	for (var i = 0; i < fromBuffer.numberOfChannels; i++) {

    // 			var fromChanData = fromBuffer.getChannelData(i)
    // 				var toChanData = toBuffer.getChannelData(i);
    // 				var f = Math.round(fromStart*sampleRate);
    // 				var t = Math.round(fromEnd*sampleRate);
    // 				var k = 0;

    // 				for (var j = 0; j < frameCount; j++) {
    // 				   if( j >= f && j <= t && (i==ch || ch>2))
    // 				   {
    // 				   	if(type=='amplifyin'){
    // 						toChanData[j] = fromChanData[j] * 2;
    // 					}else if(type=='amplifyout'){
    // 						toChanData[j] = fromChanData[j] / 2;
    // 					}else{
    // 						toChanData[j] = fromChanData[j];
    // 					}

    // 					   continue;
    // 				   }

    // 				  toChanData[j] = fromChanData[j];				 		  
    // 				}
    // 	}
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {

        var fromChanData = fromBuffer.getChannelData(i)
        //	var toChanData = toBuffer.getChannelData(i);
        var f = Math.round(fromStart * sampleRate);
        var t = Math.round(fromEnd * sampleRate);
        var k = 0;

        for (var j = 0; j < frameCount; j++) {
            if (j >= f && j <= t && (i == ch || ch < 0)) {
                if (type == 'amplifyin') {
                    fromChanData[j] = fromChanData[j] * 2;
                } else if (type == 'amplifyout') {
                    fromChanData[j] = fromChanData[j] / 2;
                }//else{
                //fromChanData[j] = fromChanData[j];
                //}

                continue;
            }

            // fromChanData[j] = fromChanData[j];				 		  
        }
    }
}

//$('.wavesurfer-region').css({'height':'50%'})
function updateTime() {
    var timeContainer = document.querySelector('#audio-time');
    var currentTime = wavesurfer.getCurrentTime();
    var totalDuration = wavesurfer.getDuration();

    timeContainer.innerHTML = '<i class="fa fa-clock-o"></i> ' + formatTime(Math.round(currentTime)) + ' /' + formatTime(Math.round(totalDuration));
}

function formatTime(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}
/**
 * Use formatTimeCallback to style the notch labels as you wish, such
 * as with more detail as the number of pixels per second increases.
 *
 * Here we format as M:SS.frac, with M suppressed for times < 1 minute,
 * and frac having 0, 1, or 2 digits as the zoom increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override timeInterval, primaryLabelInterval and/or
 * secondaryLabelInterval so they all work together.
 *
 * @param: seconds
 * @param: pxPerSec
 */
function formatTimeCallback(seconds, pxPerSec) {
    seconds = Number(seconds);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    // fill up seconds with zeroes
    var secondsStr = Math.round(seconds).toString();
    if (pxPerSec >= 25 * 10) {
        secondsStr = seconds.toFixed(2);
    } else if (pxPerSec >= 25 * 1) {
        secondsStr = seconds.toFixed(1);
    }

    if (minutes > 0) {
        if (seconds < 10) {
            secondsStr = '0' + secondsStr;
        }
        return `${minutes}:${secondsStr}`;
    }
    return secondsStr;
}

/**
 * Use timeInterval to set the period between notches, in seconds,
 * adding notches as the number of pixels per second increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param: pxPerSec
 */
function timeInterval(pxPerSec) {
    var retval = 1;
    if (pxPerSec >= 25 * 100) {
        retval = 0.01;
    } else if (pxPerSec >= 25 * 40) {
        retval = 0.025;
    } else if (pxPerSec >= 25 * 10) {
        retval = 0.1;
    } else if (pxPerSec >= 25 * 4) {
        retval = 0.25;
    } else if (pxPerSec >= 25) {
        retval = 1;
    } else if (pxPerSec * 5 >= 25) {
        retval = 5;
    } else if (pxPerSec * 15 >= 25) {
        retval = 15;
    } else {
        retval = Math.ceil(0.5 / pxPerSec) * 60;
    }
    return retval;
}

/**
 * Return the cadence of notches that get labels in the primary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function primaryLabelInterval(pxPerSec) {
    var retval = 1;
    if (pxPerSec >= 25 * 100) {
        retval = 10;
    } else if (pxPerSec >= 25 * 40) {
        retval = 4;
    } else if (pxPerSec >= 25 * 10) {
        retval = 10;
    } else if (pxPerSec >= 25 * 4) {
        retval = 4;
    } else if (pxPerSec >= 25) {
        retval = 1;
    } else if (pxPerSec * 5 >= 25) {
        retval = 5;
    } else if (pxPerSec * 15 >= 25) {
        retval = 15;
    } else {
        retval = Math.ceil(0.5 / pxPerSec) * 60;
    }

    return retval;
}

/**
 * Return the cadence of notches to get labels in the secondary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Secondary labels are drawn after primary labels, so if
 * you want to have labels every 10 seconds and another color labels
 * every 60 seconds, the 60 second labels should be the secondaries.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function secondaryLabelInterval(pxPerSec) {
    // draw one every 10s as an example
    return Math.floor(10 / timeInterval(pxPerSec));
}

function formatTime1(start, end) {
    return (start == end ? [start] : [start, end]).map(function (time) {
        return [Math.floor(time % 3600 / 60), // minutes
        ('00' + Math.floor(time % 60)).slice(-2) // seconds
        ].join(':');
    }).join('-');
}

function longToByteArray(/*long*/long) {
    // we want to represent the input as a 8-bytes array
    var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for (var index = 0; index < byteArray.length; index++) {
        var byte = long & 0xff;
        byteArray[index] = byte;
        long = (long - byte) / 256;
    }

    return byteArray;
};

function byteArrayToLong(/*byte[]*/  byteArray) {
    var value = 0;
    for (var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
};

function setControlHeight() {
    if (wavesurfer.backend.buffer.numberOfChannels == 2)
        wavesurfer.setHeight(256);


}

function sliderMarker(slide, output) {
    output.value = slide.value;
    var min = slide.min;
    var max = slide.max;
    var value = slide.value;
    var width = slide.offsetWidth;
    var percent = width / (max - min);
    var lefts = (value - min) * percent;
    output.style.left = lefts + 'px';


}


// window.addEventListener("resize", function(){
//                 var currentProgress = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
//                 // Reset graph
//                 wavesurfer.empty();
//                 wavesurfer.drawBuffer();
//                 // Set original position
//                 wavesurfer.seekTo(currentProgress);                
//             }, false);
var eventHandlers = {
    'play': function () {
        wavesurfer.playPause();
        buttons.play.disabled = buttons.play.disabled ? false : true;
        buttons.stop.disabled = !buttons.stop.disabled ? true : false;
        buttons.pause.disabled = !buttons.pause.disabled ? true : false;
    },

    'back': function () {
        wavesurfer.skipBackward();
    },

    'forth': function () {
        wavesurfer.skipForward();
    },

    'toggle-mute': function () {
        wavesurfer.toggleMute();
    },
    'volume-up': function (e) {
        var volumeRoker = document.querySelector('[data-action="volumn"]');
        var volume = volumeRoker.value;
        var newVolume = (Number(volume) + .1);
        wavesurfer.setVolume(Number(newVolume));
        volumeRoker.value = newVolume;
    },
    'volume-down': function (e) {
        var volumeRoker = document.querySelector('[data-action="volumn"]');
        var volume = volumeRoker.value;
        var newVolume = (Number(volume) - .1);
        wavesurfer.setVolume(Number(newVolume));
        volumeRoker.value = newVolume;
    }
};
function playAudio(Wavesurfer, Buttons) {
    Wavesurfer.play();
    Buttons.play.disabled = Buttons.play.disabled ? false : true;
    Buttons.stop.disabled = !Buttons.stop.disabled ? true : false;
    Buttons.pause.disabled = !Buttons.pause.disabled ? true : false;
}