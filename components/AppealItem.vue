<template>
  <div
    class="appeal-item"
    :class="{
      'is-parent': !appeal.parentId,
      'is-child': appeal.parentId,
      'is-folder': appeal.children?.length > 0,
      'is-file': !appeal.children?.length,
      'is-collapsed': isCollapsed,
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="item-content">
      <div class="item-number">{{ getHierarchicalNumber }}</div>
      <div class="item-name">
        <FolderIcon v-if="appeal.children?.length > 0" />
        <FileIcon v-else />
        {{ appeal.title }}
      </div>
      <div class="item-order">{{ getHierarchicalNumber }}</div>
      <template v-if="appeal.children?.length > 0">
        <div class="item-subcategories">
          <span class="subcategories-count">
            {{ appeal.children.length }} subcategories
          </span>
        </div>
      </template>
      <div class="item-actions">
        <div class="collapse-section" v-if="appeal.children?.length">
          <span class="children-count">{{ appeal.children.length }}</span>
          <button class="action-button" @click="toggleCollapse">
            <Arrow :is-collapsed="!isCollapsed" />
          </button>
        </div>
        <div class="dropdown">
          <button class="action-button" @click="isDropdownOpen = !isDropdownOpen">
            <ThreeDots />
          </button>
          <div class="dropdown-menu" v-if="isDropdownOpen" v-click-outside="closeDropdown">
            <button class="dropdown-item" @click="openEditModal">
              <EditIcon /> Edit
            </button>
            <button class="dropdown-item delete" @click="openDeleteModal">
              <DeleteIcon /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="appeal.children?.length && !isCollapsed" class="children">
      <AppealItem
        v-for="(child, index) in appeal.children"
        :key="child.id"
        :appeal="child"
        :parent-number="getHierarchicalNumber"
        :child-index="index"
        @drag-start="(id) => $emit('drag-start', id)"
        @drag-over="(event, id) => $emit('drag-over', event, id)"
        @drop="(event, id) => $emit('drop', event, id)"
      />
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="edit-modal" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Item</h3>
        </div>
        <div class="modal-body">
          <input v-model="editedTitle" placeholder="Title" class="modal-input" />
          <input v-model="editedDescription" placeholder="Description" class="modal-input" />
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closeEditModal">Cancel</button>
          <button class="modal-button primary" @click="saveEdit">Save</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="delete-modal" @click.self="closeDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Delete Item</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "{{ appeal.title }}"?</p>
          <p v-if="appeal.children?.length" class="warning-text">
            This will also delete all {{ appeal.children.length }} subcategories.
          </p>
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closeDeleteModal">Cancel</button>
          <button class="modal-button danger" @click="handleDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppealsStore } from '~/stores/appeals'
import type { Appeal } from '~/types/appeal'
import FolderIcon from '~/components/icons/FolderIcon.vue'
import FileIcon from '~/components/icons/FileIcon.vue'
import Arrow from '~/components/icons/Arrow.vue'
import EditIcon from '~/components/icons/EditIcon.vue'
import DeleteIcon from '~/components/icons/DeleteIcon.vue'
import ThreeDots from './icons/ThreeDots.vue'

const props = defineProps<{
  appeal: Appeal
  parentNumber?: string
  childIndex?: number
}>()

const emit = defineEmits<{
  (e: 'drag-start', id: number): void
  (e: 'drag-over', event: DragEvent, id: number): void
  (e: 'drop', event: DragEvent, id: number): void
}>()

const store = useAppealsStore()
const isCollapsed = ref(false)
const isDropdownOpen = ref(false)
const isEditing = ref(false)
const editedTitle = ref('')
const editedDescription = ref('')
const dropPosition = ref<'before' | 'after' | 'child' | null>(null)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

const getHierarchicalNumber = computed(() => {
  if (!props.parentNumber) {
    return props.appeal.id.toString()
  }
  return `${props.parentNumber}.${props.childIndex! + 1}`
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const openEditModal = () => {
  editedTitle.value = props.appeal.title
  editedDescription.value = props.appeal.description
  showEditModal.value = true
  isDropdownOpen.value = false
}

const closeEditModal = () => {
  showEditModal.value = false
  editedTitle.value = ''
  editedDescription.value = ''
}

const openDeleteModal = () => {
  showDeleteModal.value = true
  isDropdownOpen.value = false
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const handleDelete = () => {
  store.deleteAppeal(props.appeal.id)
  store.fetchAppeals(store.page)
  closeDeleteModal()
}

const saveEdit = () => {
  store.editAppeal(props.appeal.id, {
    title: editedTitle.value,
    description: editedDescription.value
  })
  closeEditModal()
}

const handleDragStart = () => {
  const element = event?.currentTarget as HTMLElement
  element.setAttribute('dragging', 'true')
  emit('drag-start', props.appeal.id)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const threshold = rect.height / 3

  if (y < threshold) {
    dropPosition.value = 'before'
  } else if (y > rect.height - threshold) {
    dropPosition.value = 'after'
  } else {
    dropPosition.value = 'child'
  }

  emit('drag-over', event, props.appeal.id)
}

const handleDragLeave = () => {
  dropPosition.value = null
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const elements = document.querySelectorAll('[dragging="true"]')
  elements.forEach(el => el.removeAttribute('dragging'))
  emit('drop', event, props.appeal.id)
  dropPosition.value = null
}
</script>

<style scoped>
.appeal-item {
  background: #161A23;
  border-radius: 4px;
  margin-bottom: 2px;
  position: relative;
}

.appeal-item:not(:last-child) {
  border-bottom: 1px solid #333B4D;
}

.appeal-item[dragging="true"] {
  background: #282540;
  opacity: 0.7;
}

.appeal-item[dragging="true"]::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #272D3B;
  border: 1px dashed #9080F9;
  border-radius: 4px;
  pointer-events: none;
}

.appeal-item.drag-placeholder {
  background: #272D3B;
  border: 1px dashed #9080F9;
  pointer-events: none;
}

.appeal-item.is-parent {
  margin-bottom: 10px;
}

.appeal-item.is-parent + .appeal-item.is-parent {
  margin-top: 10px;
}

.item-content {
  display: grid;
  grid-template-columns: 60px 1fr 80px 2fr 120px;
  padding: 18px 32px;
  gap: 16px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.is-file .item-content {
  grid-template-columns: 60px 1fr 80px 120px;
}

.item-content:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item-number {
  font-family: monospace;
  color: #8b8d90;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 60px;
  padding-left: 8px;
}

.item-order {
  font-family: monospace;
  color: #8b8d90;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 80px;
  padding-left: 8px;
}

.item-subcategories {
  color: #8b8d90;
  font-size: 0.9em;
  padding-left: 8px;
}

.item-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.action-button {
  background: transparent;
  border: none;
  color: #8b8d90;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.children {
  margin-left: 32px;
}

.drop-child {
  background: rgba(76, 110, 245, 0.1);
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #2a2d35;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  min-width: 150px;
  z-index: 100;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.delete {
  color: #ff4d4d;
}

.dropdown-item.delete:hover {
  background: rgba(255, 77, 77, 0.1);
}

.edit-form {
  padding: 12px 16px;
  background: #2a2d35;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-form input {
  background: #1e2128;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.edit-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-actions button:first-child {
  background: #4c6ef5;
  color: #fff;
}

.edit-actions button:last-child {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b8d90;
}

.collapse-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.children-count {
  background: #1E3C3C;
  padding: 1px 10px;
  color: #58E2B0;
  border-radius: 30px;
  font-size: 0.8em;
  font-weight: 500;
}

.edit-modal, .delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1E2128;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2em;
  font-weight: 500;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.modal-button.primary {
  background: #4c6ef5;
  color: #fff;
}

.modal-button.primary:hover {
  background: #4263eb;
}

.modal-button.secondary {
  background: transparent;
  border: 1px solid #333B4D;
  color: #8b8d90;
}

.modal-button.secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.modal-button.danger {
  background: #dc3545;
  color: #fff;
}

.modal-button.danger:hover {
  background: #c82333;
}

.modal-input {
  width: 100%;
  margin-bottom: 12px;
  background: #161A23;
  border: 1px solid #333B4D;
  color: #fff;
  padding: 10px 12px;
  border-radius: 4px;
}

.modal-input:focus {
  outline: none;
  border-color: #4c6ef5;
}

.warning-text {
  color: #dc3545;
  margin-top: 8px;
}
</style>
