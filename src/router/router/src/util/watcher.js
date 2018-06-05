/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/6/5
 */
import {setTarget, cleanTarget} from './dep'

export class Watcher {
  constructor (vm, expression, callback) {
    this.vm = vm
    this.callbacks = []
    this.expression = expression
    this.callbacks.push(callback)
    this.value = this.getVal()

  }
  getVal () {
    setTarget(this)
    let val = this.vm
    this.expression.split('.').forEach((key) => {
      val = val[key]
    })
    cleanTarget()
    return val
  }


  update () {
    this.callbacks.forEach((cb) => {
      cb()
    })
  }
}
