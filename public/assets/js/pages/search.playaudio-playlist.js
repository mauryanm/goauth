var wavesurferlist;
var currentTrack = 0;
var playloopready = false;
var play30sec = false;
var playjump15 = false;
var playjumpstart = 0;
var seekmouse = true;
document.addEventListener('DOMContentLoaded', function () {
    wavesurferlist = WaveSurfer.create({
        container: '#waveformlist',
        waveColor: '#428bca',
        progressColor: '#31708f',
        height: 50,
        // mediaControls: true,
        // barWidth: 2
    });

});
document.addEventListener('DOMContentLoaded', function () {
    var playPause = document.querySelector('#btn-faws-play-pause');
    playPause.addEventListener('click', function () {
        wavesurferlist.playPause();
        playloopready = true;
    });

    // Toggle play/pause text
    wavesurferlist.on('play', function () {
        document.querySelector('#icon-play').style.display = 'none';
        document.querySelector('#icon-pause').style.display = '';
    });
    wavesurferlist.on('pause', function () {
        document.querySelector('#icon-play').style.display = '';
        document.querySelector('#icon-pause').style.display = 'none';
    });
    wavesurferlist.on('ready', function () {
        $('.list-player .duration').html(moment.duration(wavesurferlist.getDuration(), 'seconds').format("hh:mm:ss"));
        // var timeline = Object.create(WaveSurferlist.Timeline);
        
        // timeline.init({
        //     wavesurferlist: wavesurferlist,
        //     container: '#waveform-timeline'
        // });
    });

    wavesurferlist.on('audioprocess', function (ct) {
        let du = wavesurferlist.getDuration();
        $('.list-player .timer').html(moment.duration(ct, 'seconds').format("hh:mm:ss"));
        setBarProgress(ct, du);
        if (play30sec && ct > 30) {
            playnext();
        }
        console.log(playjumpstart);
        if (playjump15 && ct > (playjumpstart + 15)) {
            seekmouse = false;
            playjumpstart += 15*2;
            wavesurferlist.skip(15);
            setTimeout(() => {
                seekmouse = true;
            }, 50);
        }
    });
    wavesurferlist.on('seeking', function (currentTime) {
        if (seekmouse) {
            playjumpstart = parseInt(currentTime);
        }
        // playjumpstart = parseInt(currentTime) + 15;
        // console.log(playjumpstart)
        setBarProgress(currentTime, wavesurferlist.getDuration())
    });
    // The playlist links
    playlinks = document.querySelectorAll('.play-list-item a');

    // // Load the track on click
    // Array.prototype.forEach.call(playlinks, function (link, index) {
    //     link.addEventListener('click', function (e) {
    //         e.preventDefault();
    //         setCurrentSong(index);
    //         return false;
    //     });
    // });

    // Play on audio load
    wavesurferlist.on('ready', function () {
        if (playloopready) wavesurferlist.play();
    });

    // Go to the next track on finish
    wavesurferlist.on('finish', function () {
        playjumpstart = 0;
        setCurrentSong((currentTrack + 1) % playlinks.length);
    });

    // Load the first track
    setCurrentSong(currentTrack);
});
var forward = function () { 
    wavesurferlist.skip(5);
}
var rewind = function () {
    wavesurferlist.skip(-5);
}
var stoplistplayer = function () {
    wavesurferlist.stop();
    playloopready = false;
}
var setCurrentSong = function (index) {
    if (wavesurferlist.isPlaying()) {
        wavesurferlist.stop();
    }
    $(playlinks[currentTrack]).closest('.play-list-item a').removeClass('active-track');
    currentTrack = index;
    $(playlinks[currentTrack]).closest('.play-list-item a').addClass('active-track');
    if (playlinks.length > 0) {
        wavesurferlist.load(playlinks[currentTrack].href);
        $('.infos-ctn .title').text('[' + playlinks[currentTrack].dataset.id + ']');
    }
    
};

var barProgress = document.getElementById("myBar");
var progressbar = document.querySelector('#myProgress')
progressbar.addEventListener("click", seek.bind(this));


function seek(event) {
    var percent = event.offsetX / progressbar.offsetWidth;
    wavesurferlist.seekTo(percent);
    barProgress.style.width = percent * 100 + "%";
}

function setBarProgress(ct,du) {
    var progress = (ct / du) * 100;
    document.getElementById("myBar").style.width = progress + "%";
}
var playprevious = function () {
    let cts = 0;
    let alls = playlinks.length;
    Array.prototype.forEach.call(playlinks, function (link, index) {
        if (link.classList.contains('active-track')) {
            cts = index;
        }
    });
    if (cts == 0) cts = alls;
    setCurrentSong(cts-1)
}

var playnext = function () {
    let cts = 0;
    let alls = playlinks.length;
    Array.prototype.forEach.call(playlinks, function (link, index) {
        if (link.classList.contains('active-track')) {
            cts = index;
        }
    });
    if (cts + 1 == (alls)) cts = -1;
    setCurrentSong(cts + 1)
}
var toggleMute = function () {
    let muted = wavesurferlist.getMuted();
    if (muted) {
        document.querySelector('#icon-vol-up').style.display = '';
        document.querySelector('#icon-vol-mute').style.display = 'none';
    } else {
        document.querySelector('#icon-vol-up').style.display = 'none';
        document.querySelector('#icon-vol-mute').style.display = '';
    }
    wavesurferlist.setMuted(!muted)
}
var playjumpping = function () {
    playjump15 = !playjump15;
    play30sec = false;
    if (playjump15) {
        document.querySelector('#btn-mdi-jump .on').style.display = 'none';
        document.querySelector('#btn-mdi-jump .off').style.display = '';
    } else {
        document.querySelector('#btn-mdi-jump .on').style.display = '';
        document.querySelector('#btn-mdi-jump .off').style.display = 'none';
    }
    document.querySelector('#btn-mdi-30 .on').style.display = '';
    document.querySelector('#btn-mdi-30 .off').style.display = 'none';

}
var playstart30sec = function () {
    play30sec = !play30sec;
    playjump15 = false;
    if (play30sec) {
        document.querySelector('#btn-mdi-30 .on').style.display = 'none';
        document.querySelector('#btn-mdi-30 .off').style.display = '';
    } else {
        document.querySelector('#btn-mdi-30 .on').style.display = '';
        document.querySelector('#btn-mdi-30 .off').style.display = 'none';
    }
    document.querySelector('#btn-mdi-jump .on').style.display = '';
    document.querySelector('#btn-mdi-jump .off').style.display = 'none';
}