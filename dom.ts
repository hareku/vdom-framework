type NodeType = VNode | string | number
type Attributes = { [key: string]: string | Function | undefined }

export interface View<State, Actions> {
  (state: State, actions: Actions): VNode
}

export interface VNode {
  nodeName: keyof ElementTagNameMap
  attributes: Attributes
  children: NodeType[]
}

export function h(
  nodeName: keyof ElementTagNameMap,
  attributes: Attributes | null,
  children: NodeType[]
): VNode {
  return {
    nodeName,
    attributes: attributes || {} as Attributes,
    children
  }
}

export function createElement(node: NodeType): HTMLElement | Text {
  if (!isVNode(node)) {
    return document.createTextNode(node.toString())
  }

  const el = document.createElement(node.nodeName)
  setAttributes(el, node.attributes)
  node.children.forEach(child => el.appendChild(createElement(child)))

  return el
}

function isVNode(node: NodeType): node is VNode {
  return typeof node !== "string" && typeof node !== "number"
}

function setAttributes(target: HTMLElement, attrs: Attributes): void {
  for (let attr in attrs) {
    if (isEventAttr(attr)) {
      const eventName = attr.slice(2)
      target.addEventListener(eventName, attrs[attr] as EventListener)
    } else {
      target.setAttribute(attr, attrs[attr] as string)
    }
  }
}

function isEventAttr(attr: string): boolean {
  return /^on/.test(attr)
}

enum ChangedType {
  None,
  Type,
  Text,
  Node,
  Value,
  Attr
}

function hasChanged(a: NodeType, b: NodeType): ChangedType {
  // different type
  if (typeof a !== typeof b) {
    return ChangedType.Type
  }

  // different string
  if ((!isVNode(a) && !isVNode(b)) && a !== b) {
    return ChangedType.Text
  }

  if (isVNode(a) && isVNode(b)) {
    if (a.nodeName !== b.nodeName) {
      return ChangedType.Node
    }
    if (a.attributes.value !== b.attributes.value) {
      return ChangedType.Value
    }
    if (JSON.stringify(a.attributes) !== JSON.stringify(b.attributes)) {
      return ChangedType.Attr
    }
  }
  return ChangedType.None
}

export function updateElement(
  parent: HTMLElement,
  oldNode: NodeType,
  newNode: NodeType,
  index = 0
): void {
  if (!oldNode) {
    parent.appendChild(createElement(newNode))
    return
  }

  const target = parent.childNodes[index]

  if (!newNode) {
    parent.removeChild(target)
    return
  }

  const changeType = hasChanged(oldNode, newNode)
  switch (changeType) {
    case ChangedType.Type:
    case ChangedType.Text:
    case ChangedType.Node:
      parent.replaceChild(createElement(newNode), target)
      return
    case ChangedType.Value:
      updateValue(
        target as HTMLInputElement,
        (newNode as VNode).attributes.value as string
      )
      return
    case ChangedType.Attr:
      updateAttributes(
        target as HTMLElement,
        (oldNode as VNode).attributes,
        (newNode as VNode).attributes
      )
      return
  }

  if (isVNode(oldNode) && isVNode(newNode)) {
    for (
      let i = 0;
      i < newNode.children.length || i < oldNode.children.length;
      i++
    ) {
      updateElement(
        target as HTMLElement,
        oldNode.children[i],
        newNode.children[i],
        i
      )
    }
  }
}

function updateAttributes(
  target: HTMLElement,
  oldAttrs: Attributes,
  newAttrs: Attributes
): void {
  for (let attr in oldAttrs) {
    if (!isEventAttr(attr)) {
      target.removeAttribute(attr)
    }
  }
  for (let attr in newAttrs) {
    if (!isEventAttr(attr)) {
      target.setAttribute(attr, newAttrs[attr] as string)
    }
  }
}

function updateValue(target: HTMLInputElement, newValue: string) {
  target.value = newValue
}
