import { ActionTree } from "./action"
import { View, VNode, createElement, updateElement } from "./dom"

interface AppConstructor<State> {
  el: HTMLElement | string
  view: View<State, ActionTree<State>>
  state: State
  actions: ActionTree<State>
}

export class App<State> {
  private readonly el: HTMLElement
  private readonly view: View<State, ActionTree<State>>
  private readonly state: State
  private readonly actions: ActionTree<State>
  private oldNode: VNode
  private newNode: VNode
  private skipRender: boolean

  constructor(params: AppConstructor<State>) {
    if(typeof params.el === 'string') {
      const mountTarget = document.querySelector<HTMLElement>(params.el)
      if(!mountTarget) {
        throw new Error(`The mount target ${params.el} was not found.`)
      }

      this.el = mountTarget
    } else {
      this.el = params.el
    }

    this.view = params.view
    this.state = params.state
    this.actions = this.dispatchAction(params.actions)
    this.resolveNode()
  }

  private dispatchAction(actions: ActionTree<State>) {
    const dispatched = {} as ActionTree<State>
    for (let key in actions) {
      const action = actions[key]
      dispatched[key] = (state: State, ...data: any) => {
        const ret = action(state, ...data)
        this.resolveNode()
        return ret
      }
    }
    return dispatched
  }

  private resolveNode() {
    this.newNode = this.view(this.state, this.actions)
    this.scheduleRender()
  }

  private scheduleRender() {
    if (!this.skipRender) {
      this.skipRender = true
      setTimeout(this.render.bind(this))
    }
  }

  private render(): void {
    if (this.oldNode) {
      updateElement(this.el, this.oldNode, this.newNode)
    } else {
      this.el.appendChild(createElement(this.newNode))
    }

    this.oldNode = this.newNode
    this.skipRender = false
  }
}
