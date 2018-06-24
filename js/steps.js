;(function (window) {
    var EDIT_STATE = 'EDIT'

    var api = null

    var commenUtil = {
        isTypeOf: function (obj, type) {
            switch (type) {
                case 'object':
                    return Object.prototype.toString.call(obj) === '[object Object]'
                    break
                case 'array':
                    return Object.prototype.toString.call(obj) === '[object Array]'
                    break
                default:
                    return false
            }
        },
        // 空节点
        isEmptyNode: function (node) {
            return !node.text && !node.state
        },
        // 获取一个多行wrapper
        getMuiltWrapper: function () {
            return parseDom(
                '<div class="step-wrapper__muilt"></div>'
            )
        },
        parseDom: function (html) {
            var dom = document.createElement("div")
            dom.innerHTML = html
            return dom.childNodes[0]
        },

        replacePx: function (attr) {
            return parseInt(attr.replace('px'))
        }
    }

    var isTypeOf = commenUtil.isTypeOf,
        isEmptyNode = commenUtil.isEmptyNode,
        getMuiltWrapper = commenUtil.getMuiltWrapper,
        parseDom = commenUtil.parseDom,
        replacePx = commenUtil.replacePx

    // 生成流程盒子的方法
    var initStepBox = function (node) {
        var stepBox
        // 编辑状态
        if (node.state === EDIT_STATE) {
            stepBox = parseDom(
                '<div class="step-box">' +
                '<div class="step-box__color"></div>' +

                '</div>'
            )
            var inputEl = parseDom(
                '<input class="box-input__edit" type="text" value="' + node.text + '" />'
                ),
                actionWrapper = parseDom(
                    '<div class="step-box__action"></div>'
                ),
                commitIcon = parseDom(
                    '<span class="iconfont icon-queren"></span>'
                ),
                cancelIcon = parseDom(
                    '<span class="iconfont icon-quxiao"></span>'
                )

            commitIcon.addEventListener('click', function () {
                node.text = inputEl.value
                node.state = null
                api.refresh()
            })

            cancelIcon.addEventListener('click', function () {
                node.state = null
                api.refresh()
            })

            actionWrapper.appendChild(commitIcon)
            actionWrapper.appendChild(cancelIcon)
            stepBox.appendChild(actionWrapper)
            stepBox.appendChild(inputEl)
        } else {
            stepBox = parseDom(
                '<div class="step-box">' +
                '<div class="step-box__color"></div>' +
                node.text +
                '</div>'
            )

            var actionWrapper = parseDom(
                '<div class="step-box__action"></div>'
                ),
                addIcon = parseDom(
                    '<span class="iconfont icon-jiahao"></span>'
                ),
                editIcon = parseDom(
                    '<span class="iconfont icon-bianji"></span>'
                ),
                removeIcon = parseDom(
                    '<span class="iconfont icon-jianhao"></span>'
                )

            addIcon.addEventListener('click', function () {
                var next = node.next
                if (!next) {
                    node.next = []
                }
                if (isTypeOf(next, 'object')) {
                    node.next = [next]
                }
                node.next.push({
                    text: '',
                    state: EDIT_STATE
                })
                api.refresh()
            })

            editIcon.addEventListener('click', function () {
                node.state = EDIT_STATE
                api.refresh()
            })

            removeIcon.addEventListener('click', function () {
                node.next = null
                node.text = null
                api.refresh()
            })
            actionWrapper.appendChild(addIcon)
            actionWrapper.appendChild(editIcon)
            actionWrapper.appendChild(removeIcon)
            stepBox.appendChild(actionWrapper)
        }
        return stepBox
    }

    var drawBoxes = function (wrapper, currentNode) {
        if (isTypeOf(currentNode, 'object')) {
            // 如果当前对象text为空则不继续渲染
            if (isEmptyNode(currentNode)) return
            var stepWrapper = parseDom(
                '<div class="step-wrapper"></div>'
            )
            // 生成流程盒子
            var stepBox = initStepBox(currentNode)
            stepWrapper.appendChild(stepBox)
            wrapper.appendChild(stepWrapper)
            currentNode.next && drawBoxes.apply(this, [stepWrapper, currentNode.next])
        }
        if (isTypeOf(currentNode, 'array')) {
            // 全部为空节点
            var allEmpty = currentNode.every(function (node) {
                return isEmptyNode(node)
            })
            if (allEmpty) {
                return
            }
            var newWrapper = getMuiltWrapper()
            wrapper.appendChild(newWrapper)
            for (var i = 0, len = currentNode.length; i < len; i++) {
                drawBoxes.apply(this, [newWrapper, currentNode[i]])
            }
        }
    }

    // muiltWrapper内如果里面还有muiltWrapper, 把其他子div的高度调为和最大高度一致
    var calcMuiltWrapperHeight = function (startWrapper) {
        // 可以指定从某个wrapper节点开始调整
        var muiltWrappers = startWrapper.querySelectorAll('.step-wrapper__muilt')
        var needCalcQueue = []
        // 倒序循环 从最内存开始计算高度
        for (var i = muiltWrappers.length - 1; i >= 0; i--) {
            var currentMuiltWrapper = muiltWrappers[i]
            if (!currentMuiltWrapper.querySelector('.step-wrapper__muilt')) {
                continue
            } else {
                var stepWrappers = currentMuiltWrapper.childNodes
                var maxHeight = 0
                for (var j = 0, len = stepWrappers.length; j < len; j++) {
                    var currentStepWrapper = stepWrappers[j]
                    var height = currentStepWrapper.clientHeight
                    if (height > maxHeight) {
                        maxHeight = height
                    }
                }
                for (var j = 0, len = stepWrappers.length; j < len; j++) {
                    var currentStepWrapper = stepWrappers[j]
                    currentStepWrapper.style.height = maxHeight + 'px'
                }
            }
        }
    }

    var drawDotsAndLine = function (stepWrapper, first) {
        var getDotLeft = function () {
                return parseDom(
                    '<span class="step-dot left"></span>'
                )
            },
            getDotRight = function () {
                return parseDom(
                    '<span class="step-dot right"></span>'
                )
            },
            getStepLine = function () {
                return parseDom(
                    '<span class="step-line"></span>'
                )
            },

            // 一对一直线的画法
            drawSingleLine = function (stepBox, nextWrapper) {
                var nextBox = nextWrapper.children[0]
                var nextBoxPosition = nextBox.getBoundingClientRect()
                var nextBoxLeft = nextBoxPosition.left
                var lineWidth = nextBoxLeft - currentBoxLeft - currentBoxWidth
                var line = getStepLine()
                line.style.width = lineWidth + 'px'
                stepBox.appendChild(line)
            },
            // 一对多直线画法
            drawMuiltLine = function (stepBox, nextWrapper) {
                var nextBox = nextWrapper.children[0],
                    nextBoxPosition = nextBox.getBoundingClientRect(),
                    nextBoxHeight = nextBoxPosition.height,
                    // 三角形对边长
                    oppositeLength = (currentBoxPosition.top + currentBoxHeight / 2) - (nextBoxPosition.top + nextBoxHeight / 2),
                    // 三角形邻边长
                    adjacentLength = Math.abs(nextBoxPosition.left - currentBoxPosition.left - currentBoxWidth),
                    // 三角形斜边长  c2 = 根号(a2+b2)
                    bevelLength = Math.round(Math.sqrt(Math.pow(Math.abs(oppositeLength), 2) + Math.pow(adjacentLength, 2))),
                    // 倾斜角度
                    sin = oppositeLength / bevelLength,
                    deg = Math.abs(180 * Math.asin(sin) / Math.PI),
                    line = getStepLine(),
                    // 线段是否朝上旋转
                    upward = oppositeLength > 0,
                    rotateDeg = upward ? (180 - deg) : -(180 - deg)
                line.style.width = bevelLength + 'px'
                line.style.transform = 'translateY(-50%) rotate(' + rotateDeg + 'deg)'
                stepBox.appendChild(line)
            },
            children = stepWrapper.childNodes,
            stepBox = children[0],
            nextWrapper = children[1],
            currentBoxPosition = stepBox.getBoundingClientRect(),
            currentBoxWidth = currentBoxPosition.width,
            currentBoxLeft = currentBoxPosition.left,
            currentBoxHeight = currentBoxPosition.height
        // 不是第一次进入的box 就绘制左边的点
        if (!first) {
            stepBox.appendChild(getDotLeft())
        }
        // 还有下个wrapper的话 就绘制右边的点	
        if (nextWrapper) {
            stepBox.appendChild(getDotRight())
        }
        // 到达树的底端	
        if (!nextWrapper) return false
        // 单对单盒子
        var singleTarget = nextWrapper.className.indexOf('step-wrapper__muilt') === -1

        if (singleTarget) {
            nextWrapper && drawDotsAndLine(nextWrapper)
            drawSingleLine(stepBox, nextWrapper)
        } else {
            // 单对多
            var childWrappers = nextWrapper.children
            for (var i = 0, len = childWrappers.length; i < len; i++) {
                var childWrapper = childWrappers[i]
                drawDotsAndLine(childWrapper)
                drawMuiltLine(stepBox, childWrapper)
            }
        }

    }

    var Steps = function (el, option) {
        var data = option.data
        // 是否平衡高度
        var balance = option.balance
        api = {
            init: function () {
                var fragment = document.createDocumentFragment()
                el.classList.add('step-wrapper')
                // 根据数组绘制boxes
                drawBoxes(fragment, data)
                el.appendChild(fragment)
                // 是否调整高度一致
                balance && calcMuiltWrapperHeight(el)
                // 递归绘制连线
                drawDotsAndLine(el.children[0], true)
            },
            refresh: function () {
                el.children[0].remove()
                this.init()
            }
        }
        return api;
    }

    window.Steps = Steps
})(window)