/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/6/5
 */
export class Base {

  constructor (router) {
    this.router = router
    this.current = {
      path: '/',
      query: {},
      params: {},
      name: '',
      fullPath: '/',
      route: {}
    }
  }


  /**
   * 路由转换
   * @param target 目标路径
   * @param cb 成功后的回调
   */
  transitionTo(target, cb) {
    // 通过对比传入的 routes 获取匹配到的 targetRoute 对象
    const targetRoute = match(target, this.router.routes)
    this.confirmTransition(targetRoute, () => {
      this.current.route = targetRoute
      this.current.name = targetRoute.name
      this.current.path = targetRoute.path
      this.current.query = targetRoute.query || getQuery()
      this.current.fullPath = getFullPath(this.current)
      cb && cb()
    })
  }

  /**
   * 确认跳转
   * @param route
   * @param cb
   */
  confirmTransition (route, cb) {
    // 钩子函数执行队列
    let queue = [].concat(
      this.router.beforeEach,
      this.current.route.beforeLeave,
      route.beforeEnter,
      route.afterEnter
    )

    // 通过 step 调度执行
    let i = -1
    const step = () => {
      i ++
      if (i > queue.length) {
        cb()
      } else if (queue[i]) {
        queue[i](step)
      } else {
        step()
      }

    }
    step(i)
  }
}

function getFullPath ({ path, query = {}, hash = '' }, _stringifyQuery){
  const stringify = _stringifyQuery || stringifyQuery
  return (path || '/') + stringify(query) + hash
}

export function match(path, routeMap) {
  let match = {}
  if (typeof path === 'string' || path.name === undefined) {
    for(let route of routeMap) {
      if (route.path === path || route.path === path.path) {
        match = route
        break;
      }
    }
  } else {
    for(let route of routeMap) {
      if (route.name === path.name) {
        match = route
        if (path.query) {
          match.query = path.query
        }
        break;
      }
    }
  }
  return match
}

export function getQuery() {
  const hash = location.hash
  const queryStr = hash.indexOf('?') !== -1 ? hash.substring(hash.indexOf('?') + 1) : ''
  const queryArray = queryStr ? queryStr.split('&') : []
  let query = {}
  queryArray.forEach((q) => {
    let qArray = q.split('=')
    query[qArray[0]] = qArray[1]
  })
  return query
}

function stringifyQuery (obj) {
  const res = obj ? Object.keys(obj).map(key => {
    const val = obj[key]

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return key
    }

    if (Array.isArray(val)) {
      const result = []
      val.forEach(val2 => {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(key)
        } else {
          result.push(key + '=' + val2)
        }
      })
      return result.join('&')
    }

    return key + '=' + val
  }).filter(x => x.length > 0).join('&') : null
  return res ? `?${res}` : ''
}
