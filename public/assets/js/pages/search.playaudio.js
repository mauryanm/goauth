let extractSilenc = null;
let skipsilence = false;
let playInLoop = false;
let zoomLavel = 5;
let zoomInit = 0;
let amplifyLavel = 5;
let amplifyInit = -5
let currentAmpLvl = 0;
let skipRegionPlay = false;
let rstart;
let rend;
let wavesurfer;
let amplifyObj = new Object();
let region, context, buttons, gainL, gainR, mediaElem, source, gainVolL, gainVolR, pannerNodeL, pannerNodeR, splitter, numberOfChannels;
let activeRegion = null
function loadwavesurfer(row) {
    const regions = WaveSurfer.Regions.create();
    // const hover = WaveSurfer.Hover.create({
    //     lineColor: '#ff0000',
    //     lineWidth: 2,
    //     labelBackground: '#555',
    //     labelColor: '#fff',
    //     labelSize: '11px',
    // });

    const sliderMarker = (slide, output) => {
        output.value = slide.value;
        var min = slide.min;
        var max = slide.max;
        var value = slide.value;
        var width = slide.offsetWidth;
        var percent = width / (max - min);
        var lefts = (value - min) * percent;
        output.style.left = lefts + 'px';


    }

    const stopPlyer = () => {
        wavesurfer.stop();
        updateTime();
        skipsilence = false;
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
        buttons.pause.disabled = true;
        if (skipRegionPlay) {
            skipRegionPlay = false;
            regions.clearRegions()
        }
    }


    wavesurfer = WaveSurfer.create({
        // audioContext: audioContext,
        container: '#waveform',
        waveColor: '#fc6c24',
        progressColor: '#f51414',
        height: 128,
        splitChannels: true,
        backend: 'MediaElement',
        // backend: 'WebAudio',
        mediaType: 'audio',
        media: (row.int_call_data_type == 7 ? document.querySelector("video"):''),
        hideScrollbar: false,
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
        maxCanvasWidth: 1850,
        autoCenter: true,
        autoEnd: false,
        dragToSeek: true,
        width: '100%',
        // timeInterval: 30,
        // renderFunction:renderFunction,
        removeMediaElementOnDestroy: true,
        plugins: [
            regions,
            // hover,
            // timeLine,
            WaveSurfer.Timeline.create({
                // container: '#wave-timeline',
                formatTimeCallback: formatTimeCallback,
                // primaryLabelInterval: primaryLabelInterval,
                // secondaryLabelInterval: (Math.floor(10 / 5)),
                // timeInterval : timeInterval,
                // style: {
                //     width: '0',
                //     height: '20px',
                //     display: 'flex',
                //     flexDirection: 'column',
                //     justifyContent: 'flex-end',
                //     top: 'auto',
                //     bottom: '0',
                //     color:'red',
                //     overflow: 'visible',
                //     borderLeft: '1px solid currentColor',
                //     // opacity: 0.5,
                //     // position: 'absolute',
                //     zIndex: '1',
                // },
            }),
            // WaveSurfer.Regions.create(),
        ]
    })
    // wavesurfer.load('/storage/audio/LR.wav')
    createjson(row)
    wavesurfer.on('error', function (e) {
        console.warn(e);
    });
    // if (row.int_call_data_type == 7) {
    //     // var mediaElt = document.querySelector('video');
    //     // // wavesurfer.load(mediaElt);
    //     // wavesurfer.load(mediaElt, [0.0218, 0.0183, 0.0165, 0.0198, 0.2137]);
        
    //     // // wavesurfer.setOptions({ 'media': document.getElementById('videosorce') });
    //     // // wavesurfer.media = document.getElementById('videosorce');
    //     // console.log("a", wavesurfer, mediaElt)
    // }
    // if (row.int_call_data_type == 1) {
    //     createjson(row)
    // }
    
    wavesurfer.on('ready', () => {
        wavesurfer.setVolume(buttons.volume.value);
        mediaElem = wavesurfer.media;
        let width = parseInt(wavesurfer.renderer.container.clientWidth);
        let AudioLength = wavesurfer.getDuration();
        let zmPxPerSec = (width / AudioLength);
        wavesurfer.zoom(zmPxPerSec);
        $('.modal_loader').hide();
        // for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
        //     Array.prototype.reverse.call(source.buffer.getChannelData(i));
        // }

        // source.connect(destination);
    })
    wavesurfer.on('timeupdate', (currentTime) => {
        if (skipsilence) {
            let silence = extractSilenc.find(o => parseFloat(currentTime.toFixed(2)) > parseFloat(o.start.toFixed(2)) && parseFloat(currentTime.toFixed(2)) < parseFloat(o.end.toFixed(2)));
            if (silence) {
                wavesurfer.setTime(parseFloat(silence.end));
                silence = false
            }
        }
        if (activeRegion && currentTime >= activeRegion.end) {
            wavesurfer.pause();
            skip_silence(regions.regions.indexOf(regions.regions.find(({ id }) => id === activeRegion.id)));
        }
    })
    wavesurfer.on('audioprocess', function (currentTime) {
        updateTime();
        amplifyRegions(currentTime);
    });
    wavesurfer.on('finish', function (position) {
        stopPlyer()
    })
    wavesurfer.on('dragstart', function (position) {
        rstart = position * wavesurfer.getDuration();
        bvalshift = true;
        regions.clearRegions();
    })

    wavesurfer.on('dragend', function (position) {
        rend = position * wavesurfer.getDuration();
        bvalshift = false;
        // console.log(regions, regions.regions);
        // region = regions.regions[0];
        // addwsresions(rstart, rend)
    })
    regions.enableDragSelection({
        color: 'rgba(100, 0, 100, 0.5)',
        // content:delbtn(),
    })
    wavesurfer.on('decode', (duration) => {
        const decodedData = wavesurfer.getDecodedData()
        if (decodedData) {
            // const regions = extractRegions(decodedData.getChannelData(0), duration);
            extractSilenc = extractSilences(decodedData.getChannelData(0), duration);
            // Add regions to the waveform
            // regions.forEach((region, index) => {
            //     regions.addRegion({
            //         start: region.start,
            //         end: region.end,
            //         content: index.toString(),
            //         drag: false,
            //         resize: false,
            //     })
            // })
        }
    })
    // wavesurfer.on('drag', function (position) {
    //     if (bvalshift) {
    //         var currentTime = position * wavesurfer.getDuration();

    //         var region = regions.addRegion({ start: currentTime, end: currentTime + 0.1, color: 'rgb(255, 0, 0, 1)' });

    //         //editAnnotation(region);
    //         bvalshift = false;
    //         //saveRegions();
    //         this.wavesurfer.fireEvent('region-update-end', this);
    //     }

    //     // if (pasteEnable) {
    //     //     pasteAtTime = position * wavesurfer.getDuration();
    //     // }
    //     // else {
    //     //     insertSilenceAtTime = position * wavesurfer.getDuration();
    //     // }
    // });
    regions.on('region-created', regionCreated);
    regions.on('region-removed', (re) => {
        region = undefined;
    })
    function regionCreated(region_d) {
        if (region_d.element.childNodes.length < 3) {
            var regionEl = region_d.element;
            var deleteButton = regionEl.appendChild(delbtn());
            deleteButton.addEventListener('click', function (e) {
                region_d.remove();
            });
            deleteButton.title = "Delete region";
        }
        region = region_d;
    }
    function returnObject(o) {
        var obj = [];
        Object.keys(o).forEach(function (key) {
            obj.push(o[key]);
        });
        return obj;
    }
    function leftRightchannel(value) {
        amplifyMediaReset();
        context = (context || new (window.AudioContext || window.webkitAudioContext));
        context.createGain = context.createGain || context.createGainNode;
        gainL = gainL || context.createGain();
        gainR = gainR || context.createGain();
        pannerNodeL = pannerNodeL || context.createStereoPanner();
        pannerNodeR = pannerNodeR || context.createStereoPanner();
        splitter = context.createChannelSplitter(2);
        source = (source || context.createMediaElementSource(mediaElem));

        source.connect(splitter, 0, 0);
        if (numberOfChannels == 2) {
            splitter.connect(pannerNodeL, 0);
            splitter.connect(pannerNodeR, 1);
        } else {
            splitter.connect(pannerNodeL, 0);
            splitter.connect(pannerNodeR, 0);
            splitter.connect(pannerNodeL, 1);
            splitter.connect(pannerNodeR, 1);
        }
        splitter.connect(pannerNodeL, 0);
        splitter.connect(pannerNodeR, 1);
        pannerNodeR.connect(gainR);
        pannerNodeL.connect(gainL);
        gainL.connect(context.destination, 0);
        gainR.connect(context.destination, 0);

        pannerNodeL.pan.value = -1;
        pannerNodeR.pan.value = 1;
        const ct = wavesurfer.getCurrentTime();
        const curentArr = returnObject(amplifyObj).map(x => (x.S <= ct && x.E >= ct) ? x : '').filter(Boolean);
        if (typeof curentArr !== 'undefined' && curentArr.length > 0) {
            amplifyMedia(mediaElem, curentArr[0].M, curentArr[0].L, curentArr[0].R);
        } else {
            if (value == 1) {
                gainL.gain.value = 1;
                gainR.gain.value = 0;
            } else if (value == 2) {
                gainL.gain.value = 0;
                gainR.gain.value = 1;
            } else {
                gainL.gain.value = 1;
                gainR.gain.value = 1;
            }
        }

        // volumeLeftRight(value)
        // context.decodeAudioData(request.response, function (buffer) {
        //     var source = context.createBufferSource();
        //     Array.prototype.reverse.call(buffer.getChannelData(0));
        //     Array.prototype.reverse.call(buffer.getChannelData(1));
        //     source.buffer = buffer;
        // });
    }
    function formatTimeCallback(seconds) {
        pxPerSec = wavesurfer.options.minPxPerSec;
        seconds = Number(seconds);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
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
    function timeInterval() {
        pxPerSec = wavesurfer.options.minPxPerSec;
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
    function primaryLabelInterval() {
        pxPerSec = wavesurfer.options.minPxPerSec;
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
    function secondaryLabelInterval(pxPerSec) {
        pxPerSec = wavesurfer.options.minPxPerSec;
        return Math.floor(10 / timeInterval(pxPerSec));
    }
    function amplifyMedia(mediaElem, multiplier, l, r) {
        amplifyMediaReset();
        context = (context || new (window.AudioContext || window.webkitAudioContext));
        context.createGain = context.createGain || context.createGainNode;
        gainL = gainL || context.createGain();
        gainR = gainR || context.createGain();
        pannerNodeL = pannerNodeL || context.createStereoPanner();
        pannerNodeR = pannerNodeR || context.createStereoPanner();
        splitter = context.createChannelSplitter(2);
        source = (source || context.createMediaElementSource(mediaElem));
        source.connect(splitter, 0, 0);
        if (numberOfChannels == 2) {
            splitter.connect(pannerNodeL, 0);
            splitter.connect(pannerNodeR, 1);
        } else {
            splitter.connect(pannerNodeL, 0);
            splitter.connect(pannerNodeR, 0);
            splitter.connect(pannerNodeL, 1);
            splitter.connect(pannerNodeR, 1);
        }
        pannerNodeR.connect(gainR);
        pannerNodeL.connect(gainL);
        gainL.connect(context.destination, 0);
        gainR.connect(context.destination, 0);

        pannerNodeL.pan.value = -1;
        pannerNodeR.pan.value = 1;
        const gnl = gainL.gain.value;
        const gnr = gainR.gain.value;
        if (gnl > 1) { gainL.gain.value = 1 / gnl; }
        if (gnr > 1) { gainR.gain.value = 1 / gnr }

        const curentLR = document.getElementById('ch_left_right').value;
        if (curentLR == 0) {
            if (l && r) {
                gainL.gain.value = Math.pow(2, l);
                gainR.gain.value = Math.pow(2, r);
            } else if (l) {
                gainL.gain.value = Math.pow(2, l);
                gainR.gain.value = 1;
            } else if (r) {
                gainL.gain.value = 1;
                gainR.gain.value = Math.pow(2, r);
            } else {
                gainL.gain.value = 1;
                gainR.gain.value = 1;
            }
        } else if (curentLR == 1) {
            gainL.gain.value = Math.pow(2, l);
            gainR.gain.value = 0;
        } else if (curentLR == 2) {
            gainR.gain.value = Math.pow(2, r);
            gainL.gain.value = 0;
        } else {
            console.warn('not defind')
        }
    }
    function amplifyMediaReset() {
        if (context) {
            source.disconnect();
        }
    }
    // function addwsresions(s, e) {
    //     var rs = s;
    //     var re = e;
    //     if (s > e) {
    //         rs = e;
    //         re = s;
    //     }
    //     regions.clearRegions();
    //     region = regions.addRegion({
    //         start: rs,
    //         end: re,
    //         color: 'rgba(100, 0, 100, 0.5)',
    //         drag: true,
    //         content: ' ',
    //         resize: true,
    //     });
    //     region.content.appendChild(delbtn()).addEventListener('click', function (e) {
    //         region.remove();
    //         region = undefined;
    //         amplifyLavel = 5;
    //         amplifyInit = 0;
    //         currentAmpLvl = 0;
    //     });
    // }

    buttons = {
        play_skip_silence: document.getElementById("playskipsilencebtn"),
        // play_skip_region: document.getElementById("playskipsilencerange"),
        play: document.getElementById("playbtn"),
        pause: document.getElementById("pausebtn"),
        stop: document.getElementById("stopbtn"),
        playBackRate: document.getElementById("playBackRate"),
        backward: document.getElementById("backward"),
        forward: document.getElementById("forward"),
        zoom: document.getElementById("zoombtn"),
        _zoom: document.getElementById("_zoombtn"),
        amplify: document.getElementById("amplifybtn"),
        _amplify: document.getElementById("_amplifybtn"),
        playloop: document.getElementById("playloopbtn"),
        ch_left_right: document.getElementById("ch_left_right"),
        auto_play: document.getElementById("auto_play"),
        volume: document.getElementById("volumn"),

    };
    var eventHandlers = {
        'play': function () {
            wavesurfer.playPause();
            buttons.play.disabled = buttons.play.disabled ? false : true;
            buttons.stop.disabled = !buttons.stop.disabled ? true : false;
            buttons.pause.disabled = !buttons.pause.disabled ? true : false;
        },

        'back': function () {
            wavesurfer.skip(-5);
        },

        'forth': function () {
            wavesurfer.skip(5);
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
        if ((e.metaKey || e.ctrlKey) && (e.which in map)) {
            var handler = eventHandlers[map[e.which]];
            e.preventDefault();
            e.stopImmediatePropagation();
            handler && handler(e);
        }
    });
    buttons.volume.oninput = function () {
        wavesurfer.setVolume(Number(this.value));
        sliderMarker(this, volumnoutput);
    };

    buttons.play.onclick = function () {
        wavesurfer.play();
        buttons.play.disabled = true;
        buttons.stop.disabled = false;
        buttons.pause.disabled = false;
    };

    buttons.stop.onclick = function () {
        stopPlyer()
    };
    buttons.pause.onclick = function () {
        wavesurfer.pause();
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
        buttons.pause.disabled = true;
    };
    buttons.playBackRate.onchange = function (e) {
        wavesurfer.setPlaybackRate(Number(this.value) / 100, true);
    };
    buttons.forward.onclick = function () {
        wavesurfer.skip(5);
    };
    buttons.backward.onclick = function () {
        wavesurfer.skip(-5);
    };

    buttons.amplify.onclick = function () {
        if (region) {
            pasteAmplifiedBuffer(wavesurfer.getDecodedData(), region.start, region.end, wavesurfer.getDuration(), 'amplifyin', buttons.ch_left_right.value);
            amplify(1)
        } else {
            console.error("Create region first");
        }
    };
    buttons._amplify.onclick = function () {
        if (region) {
            pasteAmplifiedBuffer(wavesurfer.getDecodedData(), region.start, region.end, wavesurfer.getDuration(), 'amplifyout', buttons.ch_left_right.value);
            amplify(-1)
        } else {
            console.error("Create region first");
        }
    };
    regions.on('region-out', (region) => {
        if (playInLoop) {
            region.play()
        } else {
            activeRegion = null
        }
    })
    buttons.playloop.addEventListener("click", function (e) {
        playInLoop = !playInLoop;
        buttons.playloop.classList.toggle('loop');
        if (region) region.play();
    }, false)
    buttons.zoom.onclick = (e) => {
        e.stopImmediatePropagation();
        // var width = parseInt(wavesurfer.drawer.container.clientWidth);
        var width = parseInt(document.querySelector('.audiowaveform').clientWidth);
        var AudioLength = wavesurfer.getDuration();
        var zmPxPerSec = (width / AudioLength);
        if (zoomInit < zoomLavel) {
            zoomInit++;
            wavesurfer.zoom(Number(zmPxPerSec * (Math.pow(2, zoomInit))));
        }
        if (zoomInit >= zoomLavel) {
            buttons.zoom.disabled = true;
        } else {
            buttons._zoom.disabled = false;
        }
    }
    buttons._zoom.onclick = (e) => {
        e.stopImmediatePropagation();
        var width = parseInt(document.querySelector('.audiowaveform').clientWidth);
        var AudioLength = wavesurfer.getDuration();
        var zmPxPerSec = (width / AudioLength);
        if (zoomInit > 0) {
            zoomInit--;
            wavesurfer.zoom(Number(zmPxPerSec * (Math.pow(2, zoomInit))));
        }
        if (zoomInit <= 0) {
            buttons._zoom.disabled = true;
        } else {
            buttons.zoom.disabled = false;
        }
        // wavesurfer.seekTo(wavesurfer.getCurrentTime()/wavesurfer.getDuration())
    };
    buttons.ch_left_right.onchange = (e) => {
        leftRightchannel(e.target.value)
    }
    function newarray(peaks) {
        let left_right_peeks = [];
        if (peaks.channels == 2) {
            let left_peek_arr = [];
            let right_peek_arr = [];;
            let j = 0;

            for (var i = 0; i < peaks.data.length;) {
                left_peek_arr[j] = peaks.data[i];
                left_peek_arr[j + 1] = peaks.data[i + 1];
                right_peek_arr[j] = peaks.data[i + 2];
                right_peek_arr[j + 1] = peaks.data[i + 3];
                i = i + 4;
                j = j + 2;
            }
            // Array.prototype.reverse.call(left_peek_arr);
            // Array.prototype.reverse.call(right_peek_arr);
            left_right_peeks.push(putMaxMinPeaksArray(left_peek_arr));
            left_right_peeks.push(putMaxMinPeaksArray(right_peek_arr));
        } else {
            left_right_peeks.push(putMaxMinPeaksArray(peaks.data));
        }
        return left_right_peeks;
    }

    function putMaxMinPeaksArray(peaks) {
        let max = peaks.reduce((max, p) => p > max ? p : max);
        let min = peaks.reduce((min, p) => p < min ? p : min);
        let minmax = Math.max(max, Math.abs(min));
        peaks.push(minmax * 1.5);
        peaks.push(-minmax * 1.5);
        return peaks;
    }
    function createjson(row) {
        axios.post('/create-peak-json-data', { cdrid: row.lng_cdr_id, file_path: row.txt_file_path }).then(function (response) {
            if (response.data.response == 'success') {
                fetch(response.data.path)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('HTTP error ' + response.status);
                        }
                        return response.json();
                    })
                    .then(peaks => {
                        // return newarray(peaks);
                        wavesurfer.load(row.txt_file_path, newarray(peaks));
                    })
                    .catch(e => {
                        console.error('error', e);
                    });
            } else {
                Swal.fire(response.data.msg, "", response.data.response);
            }
        })
    }
    function delbtn() {
        var deletebutton = document.createElement('deletebutton');
        var css = { display: 'block', float: 'right', padding: '1px', position: 'absolute', zIndex: 10, color: '#fff', marginTop: '7px', marginRight: '5px', top: 0, right: 0, cursor: 'pointer', };
        Object.assign(deletebutton.style, css);
        deletebutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        return deletebutton;
    }
    function pasteAmplifiedBuffer(fromBuffer, fromStart, fromEnd, /*toBuffer,*/ duration, type, ch) {
        ch = ch - 1;
        var sampleRate = fromBuffer.sampleRate
        var frameCount = duration * sampleRate
        for (var i = 0; i < fromBuffer.numberOfChannels; i++) {

            var fromChanData = fromBuffer.getChannelData(i)
            var f = Math.round(fromStart * sampleRate);
            var t = Math.round(fromEnd * sampleRate);
            var k = 0;

            for (var j = 0; j < frameCount; j++) {
                if (j >= f && j <= t && (i == ch || ch < 0)) {
                    if (type == 'amplifyin') {
                        fromChanData[j] = fromChanData[j] * 2;
                    } else if (type == 'amplifyout') {
                        fromChanData[j] = fromChanData[j] / 2;
                    }
                    continue;
                }
            }
        }
        // wavesurfer.setOptions({'renderFunction':{'peaks':fromChanData}})
        // Array.prototype.reverse.call( source.buffer.getChannelData (i) )
        wavesurfer.setOptions({ 'peaks': fromChanData });
    }

    function sumObjectsByKey(objs) {
        return objs.reduce((a, b) => {
            for (let k in b) {
                if (b.hasOwnProperty(k))
                    a[k] = (k == 'M' || k == 'L' || k == 'R') ? ((a[k] || 0) + b[k]) : b[k];
            }
            return a;
        }, {});
    }

    function amplifyRegions(currentTime) {
        if (Object.keys(amplifyObj).length > 0) {
            const curarr = returnObject(amplifyObj).map(x => (x.S <= currentTime && x.E >= currentTime) ? x : '').filter(Boolean);
            if (curarr.length > 0) {
                const finalArray = sumObjectsByKey(curarr);
                amplifyMedia(mediaElem, finalArray.M, finalArray.L, finalArray.R);
            } else {
                amplifyMedia(mediaElem, 0, 0, 0);
            }
        }
    }
    function amplify(factor) {
        currentAmpLvl = currentAmpLvl + factor;
        let ch_l_r = buttons.ch_left_right.value;

        if (ch_l_r == 1) {
            var lm = amplifyObj['akm'].L + factor;
            var rm = amplifyObj['akm'].R;
        } else if (ch_l_r == 2) {
            var lm = amplifyObj['akm'].L;
            var rm = amplifyObj['akm'].R + factor;
        } else {
            var lm = currentAmpLvl;
            var rm = currentAmpLvl;
        }
        amplifyObj['akm'] = {
            E: region.end,
            L: lm,
            LM: 0,
            M: currentAmpLvl,
            R: rm,
            S: region.start
        }
        if (currentAmpLvl == amplifyInit) buttons._amplify.disabled = true;
        if (currentAmpLvl == amplifyLavel) buttons.amplify.disabled = true;
        if (currentAmpLvl > amplifyInit && currentAmpLvl < amplifyLavel) {
            buttons.amplify.disabled = false;
            buttons._amplify.disabled = false;
        }
    }
    const extractRegions = (audioData, duration) => {
        const minValue = 0.01
        const minSilenceDuration = 0.2
        const mergeDuration = 0.2
        const scale = duration / audioData.length
        const silentRegions = []

        // Find all silent regions longer than minSilenceDuration
        let start = 0
        let end = 0
        let isSilent = false
        for (let i = 0; i < audioData.length; i++) {
            if (audioData[i] < minValue) {
                if (!isSilent) {
                    start = i
                    isSilent = true
                }
            } else if (isSilent) {
                end = i
                isSilent = false
                if (scale * (end - start) > minSilenceDuration) {
                    silentRegions.push({
                        start: scale * start,
                        end: scale * end,
                    })
                }
            }
        }
        // Merge silent regions that are close together
        const mergedRegions = []
        let lastRegion = null
        for (let i = 0; i < silentRegions.length; i++) {
            if (lastRegion && silentRegions[i].start - lastRegion.end < mergeDuration) {
                lastRegion.end = silentRegions[i].end
            } else {
                lastRegion = silentRegions[i]
                mergedRegions.push(lastRegion)
            }
        }

        // Find regions that are not silent
        const regions = []
        let lastEnd = 0
        for (let i = 0; i < mergedRegions.length; i++) {
            regions.push({
                start: lastEnd,
                end: mergedRegions[i].start,
            })
            lastEnd = mergedRegions[i].end
        }

        return regions
    }
    const extractSilences = (audioData, duration) => {
        const minValue = 0.01
        const minSilenceDuration = 0.2
        const mergeDuration = 0.2
        const scale = duration / audioData.length
        const silentRegions = []

        // Find all silent regions longer than minSilenceDuration
        let start = 0
        let end = 0
        let isSilent = false
        for (let i = 0; i < audioData.length; i++) {
            if (audioData[i] < minValue) {
                if (!isSilent) {
                    start = i
                    isSilent = true
                }
            } else if (isSilent) {
                end = i
                isSilent = false
                if (scale * (end - start) > minSilenceDuration) {
                    silentRegions.push({
                        start: scale * start,
                        end: scale * end,
                    })
                }
            }
        }

        // Merge silent regions that are close together
        const mergedRegions = []
        let lastRegion = null
        for (let i = 0; i < silentRegions.length; i++) {
            if (lastRegion && silentRegions[i].start - lastRegion.end < mergeDuration) {
                lastRegion.end = silentRegions[i].end
            } else {
                lastRegion = silentRegions[i]
                mergedRegions.push(lastRegion)
            }
        }

        // // Find regions that are not silent
        // const regions = []
        // let lastEnd = 0
        // for (let i = 0; i < mergedRegions.length; i++) {
        //     regions.push({
        //     start: lastEnd,
        //     end: mergedRegions[i].start,
        //     })
        //     lastEnd = mergedRegions[i].end
        // }

        return mergedRegions
    }

    const skip_silence = (index) => {
        if (regions.regions.length > index) {
            let rgn = index + 1;
            activeRegion = regions.regions[rgn];
            activeRegion.play()
        }

    }

    // regions.on('region-clicked', (region, e) => {
    //     e.stopPropagation()
    //     region.play()
    //     activeRegion = region
    //     // skip_silence(regions.regions.indexOf(regions.regions.find(({ id }) => id === region.id)));
    // })


    // regions.on('region-clicked', function(region, e) {
    //     e.stopPropagation();
    //     region.play(region.start, region.end);
    // });
    //  wavesurfer.play(10, 40)
    // regions.on('region-clicked', (region, e) => {
    //     activeRegion = region
    // })

    buttons.play_skip_silence.onclick = function (e) {
        skipsilence = !skipsilence;
        wavesurfer.play();
        document.getElementById("playbtn").disabled = true;
        document.getElementById("stopbtn").disabled = false;
        document.getElementById("pausebtn").disabled = false;
    };
    // buttons.play_skip_region.onclick = function (e) {
    //     e.stopPropagation();
    //     regions.clearRegions();
    //     const duration = wavesurfer.getDuration();
    //     const decodedData = wavesurfer.getDecodedData();
    //     skipRegionPlay = true;
    //     if (decodedData) {
    //         const regions = extractRegions(decodedData.getChannelData(0), duration);
    //         regions.forEach((region, index) => {
    //             regions.addRegion({
    //                 start: region.start,
    //                 end: region.end,
    //                 content: index.toString(),
    //                 drag: false,
    //                 resize: false,
    //             })
    //         })
    //     }
    //     document.getElementById("playbtn").disabled = true;
    //     document.getElementById("stopbtn").disabled = false;
    //     document.getElementById("pausebtn").disabled = false;
    //     activeRegion = regions.regions[0]
    //     activeRegion.play()
    //     skip_silence(regions.regions.indexOf(regions.regions.find(({ id }) => id === activeRegion.id)));
    // };
    
}

function updateTime(ptime) {
    var timeContainer = document.querySelector('#audio-time');
    let currentTime = wavesurfer.getCurrentTime();
    var totalDuration = wavesurfer.getDuration();
    timeContainer.innerHTML = '<i class="fa fa-clock"></i> ' + formatTime(Math.round(currentTime)) + ' /' + formatTime(Math.round(totalDuration));
}
function formatTime(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}
function closePlayFileModal() {
    if (wavesurfer) {
        if (region) { region.remove(); }
        if (wavesurfer.isPlaying()) {
            wavesurfer.stop();
            skipRegionPlay = false;
            updateTime();
        }

        wavesurfer.empty();
        wavesurfer.destroy();
        skipsilence = false;
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
        buttons.pause.disabled = true;
        wavesurfer = undefined;
    }
    $('.video-warper').hide();
    // console.log(window.loadwavesurfer)
    // setTimeout(function () {controlStopmpf('play');},100);
    // if(context){
    //     context.close().then(function() {
    //         pannerNodeR.disconnect(gainR);
    //         pannerNodeL.disconnect(gainL);
    //         gainL.disconnect(context.destination, 0);
    //         gainR.disconnect(context.destination, 0);
    // });}
    // console.log(window[player])
}

$(document).ready(function () {
    $("#play-file").on("hidden.bs.modal", function () {
        closePlayFileModal();
    });
})