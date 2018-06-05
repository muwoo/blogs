/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/5/29
 */

import {supportsPushState} from './util/push-state'
import {HashHistory} from './history/hash'
import {HTML5History} from './history/html5'
import {observer} from "./util/observer"
import {Watcher} from "./util/watcher"

class Router {
  constructor(options) {
    this.base = options.base
    this.routes = options.routes
    this.container = options.id
    this.mode = options.mode || 'hash'
    this.fallback = this.mode === 'history' && !supportsPushState && options.fallback !== false
    if (this.fallback) {
      this.mode = 'hash'
    }

    this.history = this.mode === 'history' ? new HTML5History(this) : new HashHistory(this)

    Object.defineProperty(this, 'route', {
      get: () => {
        return this.history.current
      }
    })

    this.init()
  }

  push(location) {
    this.history.push(location)
  }

  replace(location) {
    this.history.replace(location)
  }

  go (n) {
    this.history.go(n)
  }

  render() {
    let i
    if ((i = this.history.current) && (i = i.route) && (i = i.component)) {
      document.getElementById(this.container).innerHTML = i
    }
  }

  init() {
    const history = this.history
    observer.call(this, this.history.current)
    new Watcher(this.history.current, 'route', this.render.bind(this))
    history.transitionTo(history.getCurrentLocation())
  }

}

window.Router = Router
