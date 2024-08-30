(function ($) {

    const contentTypesByFileExtension = {
        '.htm': 'text/html',
        '.html': 'text/html',
        '.txt': 'text/plain; charset=utf-8',
        '.pdf': 'application/pdf',
        '.rtf': 'application/rtf',
        '.doc': 'application/msword',
        '.dot': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officeDocument.wordprocessingml.document',
        '.dotx': 'application/vnd.openxmlformats-officeDocument.wordprocessingml.template',
        '.xls': 'application/vnd.ms-excel',
        '.xla': 'application/vnd.ms-excel',
        '.xlc': 'application/vnd.ms-excel',
        '.xlm': 'application/vnd.ms-excel',
        '.xlt': 'application/vnd.ms-excel',
        '.xlw': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officeDocument.spreadsheetml.sheet',
        '.xltx': 'application/vnd.openxmlformats-officeDocument.spreadsheetml.template',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pps': 'application/vnd.ms-powerpoint',
        '.pot': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officeDocument.presentationml.presentation',
        '.ppsx': 'application/vnd.openxmlformats-officeDocument.presentationml.slideshow',
        '.potx': 'application/vnd.openxmlformats-officeDocument.presentationml.template',
        '.vsd': 'application/vnd.visio',
        '.vss': 'application/vnd.visio',
        '.vst': 'application/vnd.visio',
        '.vsw': 'application/vnd.visio',
        '.vdx': 'application/vnd.ms-visio.viewer',
        '.vsx': 'application/vnd.ms-visio.viewer',
        '.vtx': 'application/vnd.ms-visio.viewer',
        '.vsdx': 'application/vnd.ms-visio.drawing',
        '.vsdm': 'application/vnd.ms-visio.drawing.macroenabled',
        '.vssx': 'application/vnd.ms-visio.stencil',
        '.vssm': 'application/vnd.ms-visio.stencil.macroenabled',
        '.vstx': 'application/vnd.ms-visio.template',
        '.vstm': 'application/vnd.ms-visio.template.macroenabled',
        '.jpe': 'image/jpg',
        '.jpeg': 'image/jpg',
        '.jpg': 'image/jpg',
        '.bmp': 'image/bmp',
        '.dib': 'image/bmp',
        '.cod': 'image/cis-cod',
        '.gif': 'image/gif',
        '.ief': 'image/ief',
        '.jfif': 'image/pjpeg',
        '.png': 'image/png',
        '.pnz': 'image/png',
        '.svg': 'image/svg+xml',
        '.svgz': 'image/svg+xml',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.mp4': 'video/mp4',
        '.mov': 'video/mp4',
        '.ogg': 'video/ogg',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav'
    }

    const getFileExtension = function (filePath) {
        return '.' + filePath.split('.').pop();
    }

    const getContentTypeByFileExtension = function (fileExtension) {
        const contentTypeFounded = contentTypesByFileExtension[fileExtension];
        return contentTypeFounded || 'application/octet-stream';
    }

    $.fn.fileViewer = function (options) {

        const _defaults = $.fn.fileViewer.defaults;
        const _options = $.extend({}, _defaults, options);

        const defineViewerName = function (contentType, fileExtension) {
            return _defaults.map.contentType[contentType]
                || _defaults.map.extension[fileExtension]
                || 'default'
        }

        const defineViewer = function (contentType, fileExtension) {

            const viewerName = defineViewerName(contentType, fileExtension);

            let viewer = _options.viewers[viewerName] || _defaults.viewers[viewerName];

            if(options){
                if (options.viewers && options.viewers[viewerName]) {

                    let defaultViewer = _defaults.viewers[viewerName];
                    var customViewer = options.viewers[viewerName];

                    customViewer.id = customViewer.id || defaultViewer.id;
                    customViewer.class = customViewer.class || defaultViewer.class;
                    customViewer.render = customViewer.render || defaultViewer.render;

                    viewer = customViewer;
                }
            }

            if (!_options.generateId)
                viewer.id = '';

            viewer.name = viewerName;
            return viewer;
        }

        const buildFile = function ($el) {

            const filePath = _options.filePath || $el.data('file-path');
            if (!filePath) throw new TypeError('filePath required!');

            const fileName = _options.fileName || $el.data('file-name');
            if (!fileName) throw new TypeError('fileName required!');

            const fileExtension = _options.fileExtension || $el.data('file-extension') || getFileExtension(fileName);
            const contentType = _options.contentType || $el.data('file-contenttype') || getContentTypeByFileExtension(fileExtension);

            return {
                path: filePath,
                name: fileName,
                extension: fileExtension,
                contentType: contentType
            };
        }
        

        this.each(function () {
            var $this = $(this);

            const file = buildFile($this);

            const viewer = defineViewer(file.contentType, file.extension);

            const template = viewer.render(file);

            if (!template) throw new TypeError('Template string not returned!');

            $this.addClass(viewer.name + '-viewer-container');
            $this.html(template);

        });

        return this;
    }

    $.fn.fileViewer.defaults = {
        filePath: '',
        fileName: '',
        fileExtension: '',
        contentType: '',
        generateId: true
    }
   
    $.fn.fileViewer.defaults.viewers = {
        text: {
            id: 'text-viewer',
            class: 'text-viewer',
            render: function (file) {
                return '<iframe loading="lazy" title="viewing document ' + file.name + '" id="' + this.id + '" class="' + this.class + '" src="' + file.path + '" frameborder="0" type="' + file.contentType + '" allowfullscreen style="height:50vh" width="100%" ></iframe>';
            }
        },
        html: {
            id: 'html-viewer',
            class: 'html-viewer',
            render: function (file) {
                return '<iframe loading="lazy" title="viewing document ' + file.name + '" id="' + this.id + '" class="' + this.class + '" src="' + file.path + '" frameborder="0" type="' + file.contentType + '" allowfullscreen style="height:50vh" width="100%" ></iframe> ';
            }
        },
        pdf: {
            id: 'pdf-viewer',
            class: 'pdf-viewer',
            render: function (file) {
                return '<embed loading="lazy" title="viewing document ' + file.name + '" id="' + this.id + '" class="' + this.class + '" src="' + file.path + '#toolbar=0&navpanes=0&scrollbar=0" frameBorder="0" scrolling="auto" height="50vh" style="height:50vh" width="100%" ' + this.attributes + '></embed>'
                // return '<iframe loading="lazy" title="viewing document ' + file.name + '" id="' + this.id + '" class="' + this.class + '" src="' + file.path + '" frameborder="0"></iframe> ';
            }
        },
        image: {
            id: 'image-viewer',
            class: 'image-viewer',
            render: function (file) {
                return '<img loading="lazy" alt="viewing image ' + file.name + '" id="' + this.id + '" class="img-fluid ' + this.class + '" src="' + file.path + '" />';
            }
        },
        audio: {
            id: 'audio-viewer',
            class: 'audio-viewer',
            attributes: '',
            render: function (file) {
                return '<audio controls id="' + this.id + '" class="' + this.class + '"' + this.attributes + '><source src="' + file.path + '" type="' + file.contentType + '"></audio>';
            }
        },
        video: {
            id: 'video-viewer',
            class: 'video-viewer',
            render: function (file) {
                return '<video controls id="' + this.id + '" class="mw-100 ' + this.class + '"' + this.attributes + '><source src="' + file.path + '" type="' + file.contentType + '"></video>';
            }
        },
        tiff: {
            id: 'video-viewer',
            class: 'video-viewer',
            render: function (file) {
                if(this.id){
                    this.id = this.id+'_'+Math.round(new Date().getTime() + (Math.random() * 100));
                }else{
                    this.id = 'tiff_'+Math.round(new Date().getTime() + (Math.random() * 100));
                }
                file.id = this.id;
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'arraybuffer';
                xhr.open('GET', file.path);
                xhr.onload = function (e) {
                var tiff = new Tiff({buffer: xhr.response});
                len = tiff.countDirectory();
                file.pages = len;
                var canvas = tiff.toCanvas(canvas);
                canvas.id='canvas_'+file.id;
                
                $('#'+file.id).prepend(canvas);
                $("#page_"+file.id).text('1/'+file.pages);
                $('#next_'+file.id).prop('disabled', (file.pages===1));
            };
            xhr.send();
                var buttons = '<div class="tiff-navigater text-center"><div class="btn-group" role="group" aria-label="Basic outlined example">\
                <button type="button" class="btn btn-outline-primary" id="prev_'+this.id+'" disabled onclick="displayimage(0,\''+this.id+'\',\''+file.path+'\')">&lt;</button>\
                <button type="button" class="btn btn-outline-primary" id="page_'+this.id+'">1/1</button>\
                <button type="button" class="btn btn-outline-primary" id="next_'+this.id+'" onclick="displayimage(1,\''+this.id+'\',\''+file.path+'\')">&gt;</button>\
                </div></div>'
                return '<div id="'+this.id+'">'+buttons+'</div> ';
            }
        },
        default: {
            id: 'default-viewer',
            class: 'default-viewer',
            render: function (file) {
                return '<span id="' + this.id + '" class="' + this.class + '">File not Supported!!</span>';
            }
        }
    }

    $.fn.fileViewer.defaults.map = {
        extension: {
            '.pdf': 'pdf',
            '.txt': 'text',
            '.htm': 'html',
            '.html': 'html',
            '.ogg': 'video',
            '.webm': 'video',
            '.mp4': 'video',
            '.mov': 'video',
            '.vgg': 'video',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.apng': 'image',
            '.png': 'image',
            '.bmp': 'image',
            '.svg': 'image',
            '.tif': 'tiff',
            '.mp3': 'audio',
            '.wav': 'audio',
            '.tiff': 'tiff'
        },
        contentType: {
            'text/html': 'html'
        }
    }

})(jQuery);
function displayimage(pid,vid,file){    
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', file);
    xhr.onload = function (e) {        
        if(pid>=0 && pid<len){
            var tiff = new Tiff({buffer: xhr.response});
            len = tiff.countDirectory();
            tiff.setDirectory(pid);
            $('#next_'+vid).attr("onclick","displayimage("+(pid+1)+",'"+vid+"','"+file+"')").prop('disabled', (pid===(len-1)));
            $('#page_'+vid).text((pid+1)+'/'+len)
            $('#prev_'+vid).attr("onclick","displayimage("+(pid-1)+",'"+vid+"','"+file+"')").prop('disabled', (pid===0));
            document.getElementById("canvas_"+vid).remove();
            var canvas = tiff.toCanvas();
            canvas.id = "canvas_"+vid;
            $('#'+vid).prepend(canvas)
        }        
    };
    xhr.send();
}