// Nhóm người chơi đã lưu, và cách chuyển nhóm sang máy khác bằng chữ thường:
// mỗi tên một dòng, để dán qua Zalo/Messenger và sửa tay được.

import { MAX_PLAYERS, normalizeName, validateNewName } from './game.js'
import { KEYS, load, save } from './storage.js'

export const MAX_NAME_LENGTH = 24

export const loadGroups = () => load(KEYS.groups, [])
export const saveGroups = (groups) => save(KEYS.groups, groups)

export function newGroupId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function defaultGroupName(groups) {
  return `Nhóm ${groups.length + 1}`
}

export function formatNames(names) {
  return names.join('\n')
}

// Tách theo dòng (hoặc dấu phẩy / chấm phẩy), bỏ số thứ tự hay gạch đầu dòng
// mà người ta hay gõ kèm ("1. Lan", "- Minh"). Tên trống, trùng, hoặc vượt
// quá 20 người thì bỏ qua và đếm lại để báo cho người dùng.
export function parseNames(text) {
  const names = []
  let duplicates = 0
  let overflow = 0
  for (const line of text.split(/[\n,;]/)) {
    const name = normalizeName(line.replace(/^\s*(\d+[.)]|[-•*])\s*/, '')).slice(0, MAX_NAME_LENGTH)
    if (!name) continue
    if (names.length >= MAX_PLAYERS) overflow++
    else if (validateNewName(name, names)) duplicates++
    else names.push(name)
  }
  return { names, duplicates, overflow }
}

// Đổi chỗ phần tử i với phần tử ngay trên (delta = -1) hoặc ngay dưới (delta = 1).
export function moveItem(list, index, delta) {
  const to = index + delta
  if (to < 0 || to >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[to]] = [copy[to], copy[index]]
  return copy
}
