<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Управление сотрудниками</h3>
        <button @click="close" class="modal-close" type="button"><i class="pi pi-times"></i></button>
      </div>

      <div class="modal-body">
        <div class="section">
          <h4 class="section-title">Текущие сотрудники</h4>
          <div class="emp-list">
            <div v-for="emp in currentEmployees" :key="emp.userId" class="emp-item">
              <div class="emp-info">
                <span class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</span>
                <span class="emp-pos">{{ emp.position || '—' }}</span>
              </div>
              <button @click="removeEmployee(emp.userId)" class="btn-remove" type="button" title="Удалить"><i class="pi pi-trash"></i></button>
            </div>
            <div v-if="currentEmployees.length===0" class="empty-msg">Нет сотрудников</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <h4 class="section-title">Добавить сотрудников</h4>
          <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Поиск..." class="search-input" />
          </div>
          <div class="emp-list">
            <div v-for="user in filteredUsers" :key="user.id" class="emp-item" @click="toggleUser(user)">
              <input type="checkbox" :checked="isSelected(user.id)" class="user-cb" @click.stop @change="toggleUser(user)" />
              <div class="emp-info">
                <span class="emp-name">{{ user.firstName }} {{ user.lastName }}</span>
                <span class="emp-pos">{{ user.position || '—' }}</span>
              </div>
            </div>
            <div v-if="filteredUsers.length===0" class="empty-msg">Нет доступных сотрудников</div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="addSelected" class="btn-primary" type="button" :disabled="selectedUserIds.length===0">Добавить ({{ selectedUserIds.length }})</button>
        <button @click="close" class="btn-secondary" type="button">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ isOpen: Boolean, users: {type:Array,default:()=>[]}, currentEmployees: {type:Array,default:()=>[]} })
const emit = defineEmits(['close','add','remove'])
const searchQuery = ref('')
const selectedUserIds = ref([])
const filteredUsers = computed(() => { if (!searchQuery.value) return props.users; const q=searchQuery.value.toLowerCase(); return props.users.filter(u=>u.firstName?.toLowerCase().includes(q)||u.lastName?.toLowerCase().includes(q)||u.position?.toLowerCase().includes(q)) })
function isSelected(id) { return selectedUserIds.value.includes(id) }
function toggleUser(u) { const i=selectedUserIds.value.indexOf(u.id); i===-1?selectedUserIds.value.push(u.id):selectedUserIds.value.splice(i,1) }
function removeEmployee(id) { emit('remove',id) }
function reset() { searchQuery.value=''; selectedUserIds.value=[] }
function close() { reset(); emit('close') }
function addSelected() { const s=props.users.filter(u=>selectedUserIds.value.includes(u.id)); emit('add',s); reset() }
</script>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:10000; }
.modal-content { background:var(--color-canvas); border-radius:var(--rounded-lg); width:90%; max-width:500px; max-height:80vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; }
.modal-header h3 { margin:0; font-size:18px; color:var(--color-ink); }
.modal-close { background:transparent; border:none; cursor:pointer; font-size:16px; color:var(--color-ink-muted-48); padding:4px; border-radius:4px; }
.modal-close:hover { background:var(--color-divider-soft); }
.modal-body { padding:12px 24px; overflow-y:auto; flex:1; }
.section { margin-bottom:8px; }
.section-title { margin:8px 0; font-size:12px; font-weight:600; color:var(--color-ink-muted-48); text-transform:uppercase; letter-spacing:0.04em; }
.emp-list { display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto; }
.emp-item { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:var(--rounded-sm); background:var(--color-surface-pearl); cursor:pointer; transition:background 0.2s; }
.emp-item:hover { background:var(--color-canvas-parchment); }
.emp-info { flex:1; min-width:0; }
.emp-name { font-weight:600; font-size:13px; color:var(--color-ink); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.emp-pos { font-size:11px; color:var(--color-ink-muted-48); }
.btn-remove { flex-shrink:0; background:transparent; color:#ff3b30; border:1px solid #ff3b30; border-radius:var(--rounded-pill); cursor:pointer; font-size:12px; padding:4px 12px; transition:all 0.2s; display:flex; align-items:center; gap:4px; }
.btn-remove:hover { background:rgba(255,59,48,0.1); }
.divider { height:1px; background:var(--color-divider-soft); margin:12px 0; }
.search-bar { margin-bottom:8px; }
.search-input { width:100%; padding:10px 14px; border:1px solid var(--color-hairline); border-radius:var(--rounded-sm); font-size:14px; box-sizing:border-box; transition:border-color 0.2s; background:var(--color-canvas); color:var(--color-ink); }
.search-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(0,102,204,0.1); }
.user-cb { width:16px; height:16px; accent-color:var(--color-primary); cursor:pointer; flex-shrink:0; }
.empty-msg { text-align:center; padding:14px; color:var(--color-ink-muted-48); font-size:13px; }
.modal-actions { display:flex; gap:10px; padding:16px 24px 20px; border-top:1px solid var(--color-divider-soft); }
.btn-primary { flex:1; padding:10px 20px; background:var(--color-primary); color:var(--color-on-primary); border:none; border-radius:var(--rounded-pill); font-weight:400; font-size:14px; cursor:pointer; transition:opacity 0.2s; font-family:var(--font-body); }
.btn-primary:hover { opacity:0.85; }
.btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
.btn-secondary { flex:1; padding:10px 20px; background:transparent; color:var(--color-ink-muted-48); border:1px solid var(--color-hairline); border-radius:var(--rounded-pill); font-weight:400; font-size:14px; cursor:pointer; transition:opacity 0.2s; font-family:var(--font-body); }
.btn-secondary:hover { opacity:0.7; }
</style>
