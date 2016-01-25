define( [
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/_base/Color',
            'MultiBigWig/View/Track/MultiWiggleBase',
            'JBrowse/Util'
        ],
        function(
            declare,
            array,
            Color,
            MultiWiggleBase,
            Util
        ) {

var dojof = Util.dojof;

return declare( MultiWiggleBase, {

    _defaultConfig: function() {
        return Util.deepUpdate(
            dojo.clone( this.inherited(arguments) ),
            {
                maxExportSpan: 500000,
                style: {
                    height: 31,
                    pos_color: '#00f',
                    neg_color: '#f00',
                    bg_color: 'rgba(230,230,230,0.6)',
                    clip_marker_color: 'black'
                }
            }
        );
    },
    _drawFeatures: function( scale, leftBase, rightBase, block, canvas, pixels, dataScale ) {
        var thisB = this;
        var context = canvas.getContext('2d');
        var canvasHeight = canvas.height;
        var normalize = dataScale.normalize;
        var featureColor = typeof this.config.style.color == 'function' ? this.config.style.color :
            (function() { // default color function uses conf variables
                var disableClipMarkers = thisB.config.disable_clip_markers;
                var normOrigin = dataScale.normalize( dataScale.origin );

                return function( p , n) {
                    var feature = p.feat;
                    return ( disableClipMarkers || n <= 1 && n >= 0 )
                               // not clipped
                               ? Color.blendColors(
                                   new Color( thisB.getConfForFeature('style.bg_color', feature ) ),
                                   new Color( thisB.getConfForFeature( n >= normOrigin ? 'style.pos_color' : 'style.neg_color', feature ) ),
                                   Math.abs(n-normOrigin)
                                 ).toString()
                               // clipped
                               : ( n > 1 ? thisB.getConfForFeature( 'style.pos_color', feature )
                                         : thisB.getConfForFeature( 'style.neg_color', feature ) );

                };
            })();

        var left = block.bpToX( leftBase );
        var resolution = Util.getResolution( context, this.browser.config.highResolutionMode );
        var kheight = canvasHeight / ( dojof.keys(this.map).length * resolution );

        array.forEach( pixels, function(p,i) {
            if (p) {
                array.forEach( p, function(pi, j) {
                    if(pi) {
                        var score = pi.score;
                        var f = pi.feat;
                        var n = dataScale.normalize( score );
                        context.fillStyle = ''+featureColor( pi, n );
                        thisB._fillRectMod( context, i, j*kheight, 1, kheight );
                    }
                })
            }
        });
    },
    makeTrackLabel: function() {
        this.inherited(arguments);
        console.log('new track label');
        if(this.config.showLabels) {
            this.sublabels = array.map( dojof.keys(this.map), function(key, i) {
                return dojo.create(
                    'div', {
                        className: "track-sublabel",
                        id: "sublabel_" + key,
                        style: {
                            position: 'absolute'
                        },
                        innerHTML: key
                    }, this.div);
            }, this);
        }
    },
    updateStaticElements: function( /**Object*/ coords ) {
        this.inherited(arguments);
        var height = this.config.style.height;
        if( this.sublabels && 'x' in coords ) {
            array.forEach(this.sublabels, function(sublabel, i) {
                sublabel.style.left = coords.x+'px';
                sublabel.style.fontSize = (height/this.sublabels.length-5)+'px';
                sublabel.style.top = i*height/this.sublabels.length+'px';
            }, this);
        }
    }

});
});
