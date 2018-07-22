import ScatterChart from '../src/charts/scatter-chart'
const data = require('../data/scatter-chart-data.json')

const theChartType = ScatterChart

beforeEach(() => {
  document.body.innerHTML = '<div id="scatter-chart" style="width:500px;height:300px;"></div>'
})

describe(`using ${theChartType.name} testing basic features`, () => {
  it('insert a canvas element to container element', () => {
    let ele = document.getElementById('scatter-chart')
    let c = new ScatterChart(ele)
    c.datum(data).render()
    expect(ele.querySelector('canvas')).toBeInstanceOf(HTMLCanvasElement)
  })

  it('accept options and preserve theme options', () => {
    let ele = document.getElementById('scatter-chart')
    let c = new ScatterChart(ele)
    let colors = ['#626c91', '#a0a7e6', '#c4ebad']
    c.setOptions({ colors: colors })
    c.datum(data).render()
    expect(c.options.colors).toEqual(colors)
    expect(c.options.theme.colors).not.toEqual(colors)
    let scatters = c.children.filter(v => v.name === 'scatter')
    let scattersColor = scatters.map(v => '#' + v["material"].color.getHexString())
    expect(scattersColor.every(v => colors.indexOf(v) !== -1)).toBeTruthy()
  })

  it('accept plotOptions', () => {
    let ele = document.getElementById('scatter-chart')
    let c = new ScatterChart(ele)
    let radius = 12
    c.setPlotOptions({ radius })
    c.datum(data).render()

    expect(c.plotOptions["radius"]).toEqual(radius)
    // expect(c.options.plotOptions.scatter.radius).toEqual(radius)
    expect(Math.floor(c.getObjectByName('scatter')["geometry"].boundingSphere.radius)).toEqual(radius)
  })
})
