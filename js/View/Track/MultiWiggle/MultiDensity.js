define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/on',
    '../MultiWiggleBase',
    'JBrowse/Util',
    'dijit/Tooltip'
],
function (
    declare,
    array,
    Color,
    on,
    MultiWiggleBase,
    Util,
    Tooltip
) {
    return declare(MultiWiggleBase, {

        _defaultConfig: function () {
            return Util.deepUpdate(dojo.clone(this.inherited(arguments)), {
                maxExportSpan: 500000,
                autoscale: 'local',
                style: {
                    pos_color: '#00f',
                    neg_color: '#f00',
                    bg_color: 'rgba(230,230,230,0.6)',
                    clip_marker_color: 'black',
                    height: 100
                }
            });
        },
        _drawFeatures: function (scale, leftBase, rightBase, block, canvas, pixels, dataScale) {
            var thisB = this;
            var context = canvas.getContext('2d');
            var canvasHeight = canvas.height;
            var featureColor = typeof this.config.style.color === 'function' ? this.config.style.color :
                (function () { // default color function uses conf variables
                    var disableClipMarkers = thisB.config.disable_clip_markers;
                    var normOrigin = dataScale.normalize(dataScale.origin);

                    return function (p, n) {
                        var feature = p.feat;
                        var ret;
                        // not clipped
                        if (disableClipMarkers || n <= 1 && n >= 0) {
                            ret = Color.blendColors(
                                new Color(thisB.getConfForFeature('style.bg_color', feature)),
                                new Color(thisB.getConfForFeature(n >= normOrigin ? 'style.pos_color' : 'style.neg_color', feature)),
                                Math.abs(n - normOrigin)
                            ).toString();
                        } else {
                            ret = (n > 1 ? thisB.getConfForFeature('style.pos_color', feature)
                                : thisB.getConfForFeature('style.neg_color', feature));
                        }
                        return ret;
                    };
                })();

            var resolution = Util.getResolution(context, this.browser.config.highResolutionMode);
            var kheight = canvasHeight / (this.labels.length * resolution);

            array.forEach(pixels, function (p, i) {
                if (p) {
                    array.forEach(p, function (pi, j) {
                        if (pi) {
                            var score = pi.score;
                            var n = dataScale.normalize(score);
                            context.fillStyle = '' + featureColor(pi, n);
                            thisB._fillRectMod(context, i, j * kheight, 1, kheight);
                        }
                    });
                }
            });
        },
        makeTrackLabel: function () {
            var canvasHeight = this.config.style.height;
            var kheight = canvasHeight / (this.labels.length);
            var thisB = this;
            var c = this.config;
            this.inherited(arguments);
            if (this.config.showLabels || this.config.showTooltips) {
                this.sublabels = array.map(this.labels, function (elt) {
                    var lw = thisB.config.labelWidth ? thisB.config.labelWidth + 'px' : null;

                    var htmlnode = dojo.create('div', {
                        className: 'track-sublabel',
                        id: thisB.config.label + '_' + elt.name,
                        style: {
                            position: 'absolute',
                            height: (kheight - 1) + 'px',
                            width: thisB.config.showLabels ? lw : '10px',
                            font: thisB.config.labelFont,
                            backgroundColor: elt.color,
                            opacity: 0.2,
                            'z-index':999
                        },
                        innerHTML: thisB.config.showLabels ? elt.name : ''
                    }, thisB.div);

                    on(htmlnode, c.clickTooltips ? 'click' : 'mouseover', function () {
                        Tooltip.show(elt.name + '<br />' + (elt.description || ''), htmlnode);
                    });
                    on(htmlnode, 'mouseleave', function () {
                        Tooltip.hide(htmlnode);
                    });

                    return htmlnode;
                });
            }
        },
        updateStaticElements: function (/** Object*/ coords) {
            this.inherited(arguments);
            var height = this.config.style.height - 2;
            if (this.sublabels && 'x' in coords) {
                var len = this.sublabels.length;
                array.forEach(this.sublabels, function (sublabel, i) {
                    sublabel.style.left = coords.x + 'px';
                    sublabel.style.top = i * height / len + 'px';
                }, this);
            }
        }

    });
});
