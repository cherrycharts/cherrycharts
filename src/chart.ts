import Director from './director'
import { Object3D, Vector2 } from 'three'
import { ISize, IRect } from './interfaces'
import { defaultsDeep, merge } from 'lodash'
import optimizedResize from './interactions/optimized-resize'
import * as themes from './themes'
import * as d3time from 'd3-time'
import { capitalize } from './utils'
import { createLabel } from './three-helper'

const defualtTheme = 'walden'
type TimeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

export interface IChart {
  populateOptions()
  draw()
  build(data: any)
  updateSize(size: ISize)
}

export interface IChartInteractable {
  bindingEvents()
}

export interface IOptions{
  theme:any
}

class Chart extends Object3D implements IChart, IChartInteractable {
  xUnit
  xInterval
  xFormat
  labelUnit
  labelFormat
  labelInterval
  _title

  protected get size(): ISize {
    return this._size
  }
  protected set size(value: ISize) {
    this._size = { ...value }
  }
  protected container: Element
  protected mouse: Vector2 = new Vector2()
  protected tooltip
  protected dataProcessed: Boolean
  protected timeStart
  protected timeEnd
  protected useTimeRange: boolean = false
  protected onMouseMoveHandle:Function
  private _dataSource
  private _plotOptions
  private _customPlotOptions = {}
  public get plotOptions() {
    return this._plotOptions
  }
  public set plotOptions(value) {
    this._plotOptions = { ...value }
  }
  public get mainRect(): IRect {
    return this._mainRect
  }
  public set mainRect(value: IRect) {
    this._mainRect = { ...value }
  }
  private _mainRect: IRect
  public get dataSource() {
    return this._dataSource
  }
  public set dataSource(value) {
    this._dataSource = [...value]
  }
  private director: Director
  

  private _size: ISize
  private isResponsive: boolean
  private _options:IOptions = { theme: defualtTheme }
  
  public get options() {
    return this._options
  }
  public set options(value) {
    this._options = { ...value }
  }

  constructor(container?: Element) {
    super()
    if (container) {
      this.container = container
      this.director = new Director(container)
      this.size = this.director.size
      this.director.scene.add(this)
      this.init()
    }
  }

  public setOptions(value) {
    this.options = value
    return this
  }

  public setPlotOptions(value) {
    merge(this._customPlotOptions, value)
  }

  public populateOptions() {
    if (typeof this.options.theme === 'string') {
      let themeName = this.options.theme
      this.options.theme = themes[themeName]
    } else {
      defaultsDeep(this.options.theme, themes[defualtTheme])
    }
    this.plotOptions = this.getGlobalPlotOptions()
    merge(this.plotOptions, this._customPlotOptions)
  }

  public build(data) {
    throw new Error('Method not implemented.')
  }

  public draw(): void {
    throw new Error('Method not implemented.')
  }

  title(text?: String) {
    if (text) {
      this._title = text
      return this
    } else {
      return this._title
    }
  }

  onResize() {
    let { width, height } = this.container.getBoundingClientRect()
    if (this.size.width !== width || this.size.height !== height) {
      this.resize()
    }
  }

  resize() {
    let { width, height } = this.container.getBoundingClientRect()
    this.director.updateSize({ width, height })
    this.updateSize({ width, height })
    this.redraw()
    this.director._render()
  }

  onMouseLeaveTooltip(event) {
    if (event.relatedTarget === this.director.getCanvas()) {
      return
    }
    this.hideTooltip()
  }

  // @Debounce(250)
  hideTooltip() {
    this.tooltip.style.display = 'none'
  }

  // @Debounce(250)
  showTooltip() {
    this.tooltip.style.display = 'block'
  }

  public datum(data) {
    this.dataSource = data
    return this
  }



  public render() {
    this.populateOptions()
    this.updateMainRect()
    this.drawCommon()
    this.build(this.dataSource)
    this.dataProcessed = true
    this.draw()
    this.director._render()
  }

  public renderTo(container: Element) {
    this.container = container
    this.director = new Director(container)
    this.size = this.director.size
    this.director.scene.add(this)
    this.init()
    this.render()
    return this
  }

  public makeCopy() {
    // dirty work
    let obj = Object.assign({}, this)
    obj.container = null
    obj.dataSource = []
    obj.dataProcessed = false
    obj.director = null
    obj.size = null
    obj.children = []
    delete obj.uuid
    delete obj.position
    delete obj.rotation
    delete obj.quaternion
    delete obj.scale
    const theClass = Object.getPrototypeOf(this).constructor
    let a = new theClass()
    Object.assign(a, obj)
    return a
  }

  public timeRange(start, end, unit: TimeUnit, interval = 1) {
    this.useTimeRange = true
    this.timeStart = start
    this.timeEnd = end
    this.xUnit = d3time[`time${capitalize(unit)}`]
    this.xInterval = interval
    switch (unit) {
      case 'day':
        this.xFormat = '%b %d'
        break
    }
    return this
  }

  public xLabel(unit: TimeUnit, interval = 1) {
    this.labelUnit = d3time[`time${capitalize(unit)}`]
    this.labelInterval = interval
    switch (unit) {
      case 'month':
        this.labelFormat = '%B'
        break
    }
    return this
  }

  public bindingEvents() {
    throw new Error('Method not implemented.')
  }

  public updateSize(size: ISize): void {
    throw new Error('Method not implemented.')
  }

  protected updateMainRect(size?: ISize) {
    let theSize = size ? size : this.size
    this.size = { ...theSize }
    this.mainRect.width = this.size.width - this.mainRect.left - this.mainRect.right
    this.mainRect.height = this.size.height - this.mainRect.top - this.mainRect.bottom
  }

  protected _render(){
    this.director._render()
  }

  protected getCanvas(){
    return this.director.getCanvas()
  }



  private addTooltip() {
    this.tooltip = document.createElement('div')
    this.tooltip.className = 'cherrycharts-tooltip'
    this.container.appendChild(this.tooltip)
    this.tooltip.onmouseout = this.tooltip.onmouseleave = this.onMouseLeaveTooltip.bind(this)
  }

  private init() {
    this.isResponsive = this.getResponsive()
    if (this.isResponsive) {
      optimizedResize.add(this.onResize.bind(this))
    }
    this.addTooltip()
    this.bindingEvents()
  }

 

  private drawCommon() {
    if (this._title) {
      this.drawTitle()
    }
  }

  private drawTitle() {
    let style = this.options.theme.title.style
    let position = this.options.theme.title.position
    let horizontal = parseInt(position.x, 10) / 100
    let vetical = parseInt(position.y, 10) / 100
    let x = this.size.width * horizontal
    let y = this.size.height * vetical - style.fontSize / 2
    let label = createLabel(this._title, x, y, 0, style.fontSize, style.color)
    this.add(label)
  }

  private clearThree(obj) {
    while (obj.children.length > 0) {
      this.clearThree(obj.children[0])
      obj.remove(obj.children[0])
    }
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) obj.material.dispose()
    if (obj.texture) obj.texture.dispose()
  }

  private redraw(): void {
    this.clearThree(this)
    // this.updateMatrix()
    // this.updateMatrixWorld(true)
    this.draw()
  }

  private getGlobalPlotOptions() {
    let chartType = this.type.toLowerCase()
    let index = chartType.indexOf('chart')
    if (index !== -1) {
      chartType = chartType.substring(0, index)
      return this.options.theme.plotOptions[chartType]
    }
  }

  private getResponsive() {
    let responsive =
      this.container.style.width === '' ||
      this.container.style.height === '' ||
      this.container.style.width.indexOf('%') !== -1 ||
      this.container.style.height.indexOf('%') !== -1
    return responsive
  }
}

export default Chart
