import { defineStore } from 'pinia'
import type { Appeal } from '~/types/appeal'

interface AppealsState {
  appeals: Appeal[]
  page: number
  totalPages: number
  totalAppeals: number
  history: Array<{
    appeals: Appeal[]
    timestamp: number
  }>
  currentIndex: number
}

const MAX_HISTORY = 20

export const useAppealsStore = defineStore('appeals', {
  state: (): AppealsState => ({
    appeals: [],
    page: 1,
    totalPages: 1,
    totalAppeals: 0,
    history: [],
    currentIndex: -1
  }),

  actions: {
    async fetchAppeals(page: number = 1) {
      try {
        const response = await fetch(`/api/appeals?page=${page}&pageSize=10`)
        const data = await response.json()

        this.appeals = data.appeals
        this.totalPages = data.totalPages
        this.totalAppeals = data.totalAppeals
        this.page = page

        // Initialize history if empty
        if (this.history.length === 0) {
          this.addToHistory(this.appeals)
        }
      } catch (error) {
        console.error('Error fetching appeals:', error)
      }
    },

    addToHistory(appeals: Appeal[]) {
      // Remove future history if we're not at the latest state
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1)
      }

      // Add new state to history
      this.history.push({
        appeals: JSON.parse(JSON.stringify(appeals)),
        timestamp: Date.now()
      })

      // Keep only last MAX_HISTORY states
      if (this.history.length > MAX_HISTORY) {
        this.history = this.history.slice(-MAX_HISTORY)
      }

      this.currentIndex = this.history.length - 1
      this.saveToLocalStorage()
    },

    undo() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.appeals = JSON.parse(JSON.stringify(this.history[this.currentIndex].appeals))
        this.saveToLocalStorage()
      }
    },

    redo() {
      if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++
        this.appeals = JSON.parse(JSON.stringify(this.history[this.currentIndex].appeals))
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('appealsHistory', JSON.stringify({
        history: this.history,
        currentIndex: this.currentIndex
      }))
    },

    loadFromLocalStorage() {
      const saved = localStorage.getItem('appealsHistory')
      if (saved) {
        const { history, currentIndex } = JSON.parse(saved)
        this.history = history
        this.currentIndex = currentIndex
        if (history[currentIndex]) {
          this.appeals = JSON.parse(JSON.stringify(history[currentIndex].appeals))
        }
      }
    },

    moveAppeal(draggedId: number, targetId: number, position: 'before' | 'after' | 'child') {
      const draggedAppeal = this.findAppeal(this.appeals, draggedId)
      const targetAppeal = this.findAppeal(this.appeals, targetId)

      if (!draggedAppeal || !targetAppeal) return

      // Don't allow moving a parent into its own child
      if (this.isDescendant(draggedAppeal, targetAppeal)) return

      // Only allow files to be moved inside folders
      if (!draggedAppeal.isFolder && position !== 'child') {
        const targetParent = this.findAppeal(this.appeals, targetAppeal.parentId!)
        if (!targetParent?.isFolder) return
      }

      // Don't allow files at root level
      if (!draggedAppeal.isFolder && !targetAppeal.isFolder && position !== 'child') return

      // Remove the dragged appeal from its current position
      this.removeAppeal(this.appeals, draggedId)

      // If moving a child, ensure it stays within its parent
      if (draggedAppeal.parentId) {
        const parentAppeal = this.findAppeal(this.appeals, draggedAppeal.parentId)
        if (parentAppeal && !this.isDescendantOf(targetAppeal, parentAppeal)) {
          // If we can't move to the target location, put it back in its original position
          this.insertAfter(this.appeals, parentAppeal.id, draggedAppeal)
          return
        }
      }

      // Add the appeal to its new position
      switch (position) {
        case 'before':
          if (draggedAppeal.isFolder) {
            this.insertBefore(this.appeals, targetId, draggedAppeal)
          }
          break
        case 'after':
          if (draggedAppeal.isFolder) {
            this.insertAfter(this.appeals, targetId, draggedAppeal)
          }
          break
        case 'child':
          if (targetAppeal.isFolder) {
            if (!targetAppeal.children) {
              targetAppeal.children = []
            }
            draggedAppeal.parentId = targetAppeal.id
            targetAppeal.children.push(draggedAppeal)
          }
          break
      }

      // Add the new state to history
      this.addToHistory(this.appeals)
    },

    editAppeal(id: number, updates: Partial<Appeal>) {
      const appeal = this.findAppeal(this.appeals, id)
      if (appeal) {
        Object.assign(appeal, updates)
        this.addToHistory(this.appeals)
      }
    },

    deleteAppeal(id: number) {
      const appeal = this.findAppeal(this.appeals, id)
      if (!appeal) return

      // If it's a parent appeal, delete all children first
      if (appeal.children?.length) {
        appeal.children.forEach(child => this.deleteAppeal(child.id))
      }

      this.removeAppeal(this.appeals, id)
      this.addToHistory(this.appeals)

      // Save to backend (mock API)
      fetch(`/api/appeals/${id}`, { method: 'DELETE' })
        .catch(error => console.error('Error deleting appeal:', error))
    },

    findAppeal(appeals: Appeal[], id: number): Appeal | null {
      for (const appeal of appeals) {
        if (appeal.id === id) return appeal
        if (appeal.children) {
          const found = this.findAppeal(appeal.children, id)
          if (found) return found
        }
      }
      return null
    },

    removeAppeal(appeals: Appeal[], id: number) {
      const index = appeals.findIndex(a => a.id === id)
      if (index !== -1) {
        appeals.splice(index, 1)
        return true
      }

      for (const appeal of appeals) {
        if (appeal.children && this.removeAppeal(appeal.children, id)) {
          return true
        }
      }
      return false
    },

    insertBefore(appeals: Appeal[], targetId: number, appeal: Appeal) {
      const index = appeals.findIndex(a => a.id === targetId)
      if (index !== -1) {
        appeals.splice(index, 0, appeal)
        return true
      }

      for (const a of appeals) {
        if (a.children && this.insertBefore(a.children, targetId, appeal)) {
          return true
        }
      }
      return false
    },

    insertAfter(appeals: Appeal[], targetId: number, appeal: Appeal) {
      const index = appeals.findIndex(a => a.id === targetId)
      if (index !== -1) {
        appeals.splice(index + 1, 0, appeal)
        return true
      }

      for (const a of appeals) {
        if (a.children && this.insertAfter(a.children, targetId, appeal)) {
          return true
        }
      }
      return false
    },

    isDescendant(parent: Appeal, child: Appeal): boolean {
      if (!parent.children) return false
      return parent.children.some(c =>
        c.id === child.id || this.isDescendant(c, child)
      )
    },

    isDescendantOf(appeal: Appeal, ancestor: Appeal): boolean {
      if (!ancestor.children) return false
      return ancestor.children.some(child =>
        child.id === appeal.id || this.isDescendantOf(appeal, child)
      )
    }
  }
})
