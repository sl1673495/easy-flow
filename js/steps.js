;
(function(window) {
	var steps = function(el, option) {
		var EDIT_STATE = 'EDIT'
		var data = option.data
		// 是否平衡高度
		var balance = option.balance
		var api = {
			init: function() {
				el.className += ' step-wrapper'
				var fragment = document.createDocumentFragment()
				// 根据数组绘制boxes
				drawBoxes.apply(this, [fragment, data])
				el.appendChild(fragment)
				balance && calcMuiltWrapperHeight()
				// 递归绘制连线
				drawDotsAndLine(el.children[0], true)

				function drawBoxes(wrapper, currentNode) {
					if(isTypeOf(currentNode, 'object')) {
						// 如果当前对象text为空则不继续渲染
						if(isEmptyNode(currentNode)) return
						var stepWrapper = parseDom(
							'<div class="step-wrapper"></div>'
						)
						// 生成流程盒子
						var stepBox = initStepBox(currentNode)
						stepWrapper.appendChild(stepBox)
						wrapper.appendChild(stepWrapper)
						currentNode.next && drawBoxes.apply(this, [stepWrapper, currentNode.next])
					}
					if(isTypeOf(currentNode, 'array')) {
						// 全部为空节点
						var allEmpty = currentNode.every(function(node) {
							return isEmptyNode(node)
						})
						if(allEmpty) {
							return
						}
						var newWrapper = getMuiltWrapper()
						wrapper.appendChild(newWrapper)
						for(var i = 0, len = currentNode.length; i < len; i++) {
							drawBoxes.apply(this, [newWrapper, currentNode[i]])
						}
					}
				}
				// muiltWrapper内如果里面还有muiltWrapper, 把其他子div的高度调为和最大高度一致
				function calcMuiltWrapperHeight(startWrapper) {
					// 可以指定从某个wrapper节点开始调整
					var queryEl = startWrapper || el
					var muiltWrappers = queryEl.querySelectorAll('.step-wrapper__muilt')
					var needCalcQueue = []
					// 倒序循环 从最内存开始计算高度
					for(var i = muiltWrappers.length - 1; i >= 0; i--) {
						var currentMuiltWrapper = muiltWrappers[i]
						if(!currentMuiltWrapper.querySelector('.step-wrapper__muilt')) {
							continue
						} else {
							var stepWrappers = currentMuiltWrapper.childNodes
							var maxHeight = 0
							for(var j = 0, len = stepWrappers.length; j < len; j++) {
								var currentStepWrapper = stepWrappers[j]
								var height = currentStepWrapper.clientHeight
								if(height > maxHeight) {
									maxHeight = height
								}
							}
							for(var j = 0, len = stepWrappers.length; j < len; j++) {
								var currentStepWrapper = stepWrappers[j]
								currentStepWrapper.style.height = maxHeight + 'px'
							}
						}
					}
				}

				function drawDotsAndLine(stepWrapper, first) {
					var children = stepWrapper.childNodes
					var stepBox = children[0]
					var nextWrapper = children[1]
					var currentBoxPosition = stepBox.getBoundingClientRect()
					var currentBoxWidth = currentBoxPosition.width
					var currentBoxLeft = currentBoxPosition.left
					var currentBoxHeight = currentBoxPosition.height
					// 不是第一次进入的box 就绘制左边的点
					;
					!first && stepBox.appendChild(_getDotLeft())
					// 还有下个wrapper的话 就绘制右边的点	
					nextWrapper && stepBox.appendChild(_getDotRight())

					// 到达树的底端	
					if(!nextWrapper) return

					// 单对单
					var singleTarget = nextWrapper.className.indexOf('step-wrapper__muilt') === -1

					if(singleTarget) {
						nextWrapper && drawDotsAndLine(nextWrapper)
						_drawSingleLine(stepBox, nextWrapper)
					} else {
						// 单对多
						var childWrappers = nextWrapper.children
						for(var i = 0, len = childWrappers.length; i < len; i++) {
							var childWrapper = childWrappers[i]
							drawDotsAndLine(childWrapper)
							_drawMuiltLine(stepBox, childWrapper)
						}
					}
					// 一对一直线的画法
					function _drawSingleLine(stepBox, nextWrapper) {
						var nextBox = nextWrapper.children[0]
						var nextBoxPosition = nextBox.getBoundingClientRect()
						var nextBoxLeft = nextBoxPosition.left
						var lineWidth = nextBoxLeft - currentBoxLeft - currentBoxWidth
						var line = _getStepLine()
						line.style.width = lineWidth + 'px'
						stepBox.appendChild(line)
					}
					// 一对多直线画法
					function _drawMuiltLine(stepBox, nextWrapper) {
						var nextBox = nextWrapper.children[0]
						var nextBoxPosition = nextBox.getBoundingClientRect()
						var nextBoxHeight = nextBoxPosition.height
						// 三角形对边长
						var oppositeLength = (currentBoxPosition.top + currentBoxHeight / 2) - (nextBoxPosition.top + nextBoxHeight / 2)
						// 三角形邻边长
						var adjacentLength = Math.abs(nextBoxPosition.left - currentBoxPosition.left - currentBoxWidth)
						// 三角形斜边长  c2 = 根号(a2+b2)
						var bevelLength = Math.round(Math.sqrt(Math.pow(Math.abs(oppositeLength), 2) + Math.pow(adjacentLength, 2)))
						// 倾斜角度
						var sin = oppositeLength / bevelLength
						var deg = Math.abs(180 * Math.asin(sin) / Math.PI)
						var line = _getStepLine()
						// 线段是否朝上旋转
						var upward = oppositeLength > 0
						var rotateDeg = upward ? (180 - deg) : -(180 - deg)
						line.style.width = bevelLength + 'px'
						line.style.transform = 'translateY(-50%) rotate(' + rotateDeg + 'deg)'
						stepBox.appendChild(line)
					}

					function _getDotLeft() {
						return parseDom(
							'<span class="step-dot left"></span>'
						)
					}

					function _getDotRight() {
						return parseDom(
							'<span class="step-dot right"></span>'
						)
					}

					function _getStepLine() {
						return parseDom(
							'<span class="step-line"></span>'
						)
					}
				}
				// 生成流程盒子的方法
				function initStepBox(node) {
					var stepBox
					// 编辑状态
					if(node.state === EDIT_STATE) {
						stepBox = parseDom(
							'<div class="step-box">' +
							'<div class="step-box__color"></div>' +

							'</div>'
						)
						var inputEl = parseDom(
							'<input class="box-input__edit" type="text" value="' + node.text + '" />'
						)
						var actionWrapper = parseDom(
							'<div class="step-box__action"></div>'
						)

						var commitIcon = parseDom(
							'<span class="iconfont icon-queren"></span>'
						)

						var cancelIcon = parseDom(
							'<span class="iconfont icon-quxiao"></span>'
						)

						commitIcon.addEventListener('click', function() {
							node.text = inputEl.value
							node.state = null
							api.refresh()
						})

						cancelIcon.addEventListener('click', function() {
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
						)
						var addIcon = parseDom(
							'<span class="iconfont icon-jiahao"></span>'
						)

						var editIcon = parseDom(
							'<span class="iconfont icon-bianji"></span>'
						)

						var removeIcon = parseDom(
							'<span class="iconfont icon-jianhao"></span>'
						)

						addIcon.addEventListener('click', function() {
							var next = node.next
							if(!next) {
								node.next = []
							}
							if(isTypeOf(next, 'object')) {
								node.next = [next]
							}
							node.next.push({
								text: '',
								state: EDIT_STATE
							})
							api.refresh()
						})

						editIcon.addEventListener('click', function() {
							node.state = EDIT_STATE
							api.refresh()
						})

						removeIcon.addEventListener('click', function() {
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
				// 空节点
				function isEmptyNode(node) {
					return !node.text && !node.state
				}
			},
			refresh: function() {
				el.children[0].remove()
				this.init()
			}
		}
		return api;
		// 获取一个多行wrapper
		function getMuiltWrapper() {
			return parseDom(
				'<div class="step-wrapper__muilt"></div>'
			)
		}

		function parseDom(html) {　　
			var dom = document.createElement("div")
			dom.innerHTML = html
			return dom.childNodes[0]
		}

		function replacePx(attr) {
			return parseInt(attr.replace('px'))
		}

		function isTypeOf(obj, type) {
			switch(type) {
				case 'object':
					return Object.prototype.toString.call(obj) === '[object Object]'
					break
				case 'array':
					return Object.prototype.toString.call(obj) === '[object Array]'
					break
				default:
					return false
			}
		}

	}

	window.steps = steps
})(window)