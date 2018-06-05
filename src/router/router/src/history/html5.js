/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/5/29
 */
/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/5/29
 */
import {Base, match} from './base'

export class HTML5History extends Base {
  constructor (router) {
    super(router)
    window.addEventListener('popstate', () => {
      this.transitionTo(getLocation())
    })
  }

  /**
   * 跳转，添加历史记录
   * @param location
   * @example this.push({name: 'home'})
   * @example this.push('/')
   */
  push (location) {
    const targetRoute = match(location, this.router.routes)

    this.transitionTo(targetRoute, () => {
      changeUrl(this.router.base, this.current.fullPath)
    })
  }

  /**
   * 跳转，添加历史记录
   * @param location
   * @example this.replaceState({name: 'home'})
   * @example this.replaceState('/')
   */
  replaceState(location) {
    const targetRoute = match(location, this.router.routes)

    this.transitionTo(targetRoute, () => {
      changeUrl(this.router.base, this.current.fullPath, true)
    })
  }

  go (n) {
    window.history.go(n)
  }

  getCurrentLocation () {
    return getLocation(this.router.base)
  }
}

function getLocation (base = ''){
  let path = window.location.pathname
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length)
  }
  return (path || '/') + window.location.search + window.location.hash
}

function changeUrl(base, path, replace) {
  if (replace) {
    window.history.replaceState({}, '', (base + path).replace(/\/\//g, '/'))
  } else {
    window.history.pushState({}, '', (base + path).replace(/\/\//g, '/'))
  }
}



