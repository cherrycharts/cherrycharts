import { Color, LineBasicMaterial, LineSegments } from 'three'
import { createBufferGeometry,createLabel } from '../three-helper'
import { DataSource, Bar } from '../components/bar'
import { IRect, ICartesian, ICartesianInfo } from '../interfaces'
import { IChartInteractable } from '../chart'
import CartesianChart from './cartesian-chart'
import { scaleOrdinal, scaleBand } from 'd3-scale'
import {range} from '../utils'

export default class BarChart extends CartesianChart implements ICartesian, IChartInteractable {
  dataSource: DataSource
  barWidth: number
  barGap: number
  bars: Bar
  type = 'BarChart'

  protected onMouseMoveHandle
  constructor(dom: Element) {
    super(dom)
    this.barWidth = 20
    this.barGap = 10
  }

  buildCartesianInfo(data?: DataSource) {
    let theData = data ? data : this.dataSource
    let padding = 0.2 // this.barGap /this.mainRect.width
    super.buildCartesianInfo(theData)

    let xScale = scaleBand()
      .domain(range(theData.length))
      .rangeRound([this.mainRect.left, this.mainRect.left + this.mainRect.width])
      .paddingInner(padding)
      .paddingOuter(padding)

    this.cartesian.xScale = xScale
  }

  drawXAxisTick() {
    let material = new LineBasicMaterial({
      color: this.options.theme.axisTick.style.color
    })
    let Y = this.mainRect.bottom
    let arr = []

    // let offsetX = this.mainRect.left + this.barGap + this.barWidth / 2

    // let stepWidth = this.barWidth + this.barGap

    let xArr = this.dataSource.map((v, i) => {
      return this.cartesian.xScale(i) + this.cartesian.xScale.bandwidth() / 2 // +this.cartesian.xScale.paddingOuter()*this.mainRect.width
    })
    let xMax = this.mainRect.left + this.mainRect.width
    xArr.some((v, i) => {
      if (v > xMax) {
        return true
      }
      arr.push(v, Y, 0, v, Y - this.options.theme.axisTick.style.length, 0)
      return false
    })

    let geometry = createBufferGeometry(arr, 'xAxisTick')
    let lines = new LineSegments(geometry, material)
    this.add(lines)
  }

  drawXAxisLabel() {
    let size = this.options.theme.labels.style.fontSize
    let tickSize = this.options.theme.axisTick.style.length
    let Y = this.mainRect.bottom
    // let offsetX = this.mainRect.left + this.barGap + this.barWidth / 2
    // let stepWidth = this.barWidth + this.barGap
    // let xArr = this.dataSource.map((v, i) => {
    //   return i * stepWidth + offsetX
    // })
    let xArr = this.dataSource.map((v, i) => {
      return this.cartesian.xScale(i) + this.cartesian.xScale.bandwidth() / 2 // + this.cartesian.xScale.paddingOuter()*this.mainRect.width
    })
    let xMax = this.mainRect.left + this.mainRect.width
    xArr.some((v, i) => {
      if (v > xMax) {
        return true
      }
      let mesh = createLabel(
        this.dataSource[i][0],
        v,
        Y - tickSize - size / 2 - 2,
        0,
        size,
        this.options.theme.labels.style.color
      )
      this.add(mesh)
      return false
    })
  }


  draw() {
    this.drawAxis()
    this.bars = new Bar(
      this.dataSource,
      this.cartesian,
      this.mainRect,
      this.options.theme.colors,
      this.barWidth,
      this.barGap
    )
    this.add(this.bars)
  }

  bindingEvents() {
    this.onMouseMoveHandle = this.onMouseMove.bind(this)
    let domElement = this.getCanvas()
    domElement.addEventListener('mousemove', this.onMouseMoveHandle, false)
    domElement.onmouseout = domElement.onmouseleave = this.onMouseLeave.bind(this)
    // domElement.onmouseover = domElement.onmouseenter = this.onMouseEnter.bind(this)
  }

  onMouseMove(event) {
    let barsLen = this.bars.children.length
    let domElement = this.getCanvas()
    let rect = domElement.getBoundingClientRect()

    this.mouse.x = event.clientX - rect.left
    this.mouse.y = this.size.height - Math.abs(event.clientY - rect.top)
    if (this.mouse.y < this.mainRect.bottom || this.mouse.x < this.mainRect.left) {
      this.hideTooltip()
      return
    }
    let offsetXWithHalfWidth = this.mouse.x + this.barWidth / 2
    let finalIndex = this.bars.children.findIndex(x => {
      return (
        offsetXWithHalfWidth >= x.position.x && offsetXWithHalfWidth <= x.position.x + this.barWidth
      )
    })

    
    if (finalIndex === -1) {
      this.hideTooltip()
      return
    }
    let [label, value] = this.dataSource[finalIndex]
    if(this.mouse.y> this.cartesian.yScale(value) ){
      this.hideTooltip()
      return
    }
    let position = this.bars.children[finalIndex].position
    const keys = Array(barsLen).keys()
    if (!(finalIndex in Array.from(keys))) {
      this.hideTooltip()
      return
    }

    this.showTooltip()
    let offsetX = rect.left + position.x
   
    let tooltipRect = this.tooltip.getBoundingClientRect()
    this.tooltip.style.left = `${offsetX - tooltipRect.width / 2}px`
    this.tooltip.style.top = `${event.clientY - tooltipRect.height}px`
    let html = `${label} ${value}`
    if (this.tooltip.innerHTML !== html) {
      this.tooltip.innerHTML = `${label} ${value}`
    }
  }

  onMouseEnter(event) {
    if (event.relatedTarget === this.tooltip) {
      return
    }
    this.showTooltip()
  }

  onMouseLeave(event) {
    if (event.relatedTarget === this.tooltip) {
      return
    }
    this.hideTooltip()
  }
}
