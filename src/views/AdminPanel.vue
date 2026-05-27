<template>
  <main class="admin-panel-container">
    <div class="page-header">
      <h1>Администрирование</h1>
    </div>

    <div v-if="isUserAdmin" class="admin-panel">
      <section class="stat-tile">
        <div class="stat-inner">
          <span class="stat-value">{{ allUsers.length }}</span>
          <span class="stat-label">Всего сотрудников</span>
        </div>
      </section>

      <div class="columns">
        <div class="column">
          <div class="column-actions">
            <button class="btn-pill" @click="showCreateModal = true" type="button">
              <i class="pi pi-user-plus"></i> Создать пользователя
            </button>
          </div>

          <section class="card-tile">
            <div class="card-head">
              <h2>Сотрудники</h2>
              <span class="card-badge">{{ allUsers.length }}</span>
            </div>

            <template v-if="userStore.isLoading">
              <Skeleton width="100%" height="64px" borderRadius="8px" class="sk-mb" v-for="i in 3" :key="'u'+i" />
            </template>

            <template v-else-if="allUsers.length > 0">
              <div class="list-items">
                <div v-for="user in allUsers" :key="user.id" class="list-item">
                  <div class="item-info">
                    <div class="item-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="item-sub">
                      <span>@{{ user.username }}</span>
                      <span class="item-sep">·</span>
                      <span>{{ user.position || '—' }}</span>
                    </div>
                    <div class="item-tags">
                      <span v-for="role in user.roles" :key="role" class="role-tag" :class="'role-'+role">{{ role }}</span>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="item-btn edit" @click="openEditModal(user)" type="button"><i class="pi pi-pencil"></i></button>
                    <button class="item-btn delete" @click="confirmDeleteUser(user)" :disabled="user.id===userStore.currentUser?.id" type="button"><i class="pi pi-trash"></i></button>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="empty-content">
              <p class="empty-title">Нет сотрудников</p>
              <p class="empty-desc">Создайте первого пользователя</p>
            </div>
          </section>
        </div>

        <div class="column">
          <div class="column-actions">
            <button class="btn-pill-outline" @click="showCreateCafeModal = true" type="button">
              <i class="pi pi-building"></i> Создать кафе
            </button>
          </div>

          <section class="card-tile">
            <div class="card-head">
              <h2>Кафе</h2>
              <span class="card-badge">{{ cafes.length }}</span>
            </div>

            <template v-if="cafesLoading">
              <Skeleton width="100%" height="64px" borderRadius="8px" class="sk-mb" v-for="i in 3" :key="'c'+i" />
            </template>

            <template v-else-if="cafes.length > 0">
              <div class="list-items">
                <div v-for="cafe in cafes" :key="cafe.id" class="list-item">
                  <div class="item-info">
                    <div class="item-name">{{ cafe.name }}</div>
                    <div class="item-sub">
                      <span v-if="cafe.address">{{ cafe.address }}</span>
                      <span class="item-sep" v-if="cafe.address&&cafe.phone">·</span>
                      <span v-if="cafe.phone">{{ cafe.phone }}</span>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="item-btn edit" @click="openEditCafeModal(cafe)" type="button"><i class="pi pi-pencil"></i></button>
                    <button class="item-btn delete" @click="confirmDeleteCafe(cafe)" type="button"><i class="pi pi-trash"></i></button>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="empty-content">
              <p class="empty-title">Нет кафе</p>
              <p class="empty-desc">Создайте первое кафе</p>
            </div>
          </section>
        </div>
      </div>
    </div>

    <div v-else class="empty-section">
      <p class="empty-title">Доступ запрещён</p>
      <p class="empty-desc">Только администратор может управлять пользователями и кафе</p>
    </div>

    <CreateUserModal :is-open="showCreateModal" @close="showCreateModal=false" @success="handleUserUpdated" />
    <EditUserModal :is-open="showEditModal" :user="selectedUser" @close="showEditModal=false" @success="handleUserUpdated" />
    <CreateCafeModal :is-open="showCreateCafeModal" @close="showCreateCafeModal=false" @success="handleCafeUpdated" />
    <EditCafeModal :is-open="showEditCafeModal" :cafe="selectedCafe" @close="showEditCafeModal=false" @success="handleCafeUpdated" />

    <div v-if="showConfirmModal" class="confirm-overlay" @click.self="closeConfirmModal">
      <div class="confirm-card">
        <div class="confirm-head"><h3>Подтверждение</h3></div>
        <div class="confirm-body"><p>{{ confirmMessage }}</p></div>
        <div class="confirm-actions">
          <button class="btn-pill btn-danger" @click="executeConfirm" type="button">Удалить</button>
          <button class="btn-pill-outline" @click="closeConfirmModal" type="button">Отмена</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useUserStore } from '@/stores/user';
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'
import { getAllCafes, deleteCafe } from '@/api/cafe'
import CreateUserModal from '@/components/modal/adminPanel/CreateUserModal.vue';
import EditUserModal from '@/components/modal/adminPanel/EditUserModal.vue';
import CreateCafeModal from '@/components/modal/adminPanel/CreateCafeModal.vue';
import EditCafeModal from '@/components/modal/adminPanel/EditCafeModal.vue';

const toast = useToast()
const userStore = useUserStore();
const allUsers = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref(null)
const showCreateCafeModal = ref(false)
const showEditCafeModal = ref(false)
const selectedCafe = ref(null)
const cafes = ref([])
const cafesLoading = ref(false)
const isUserAdmin = computed(() => userStore.isAdmin)
const showConfirmModal = ref(false)
const confirmMessage = ref('')
let confirmCallback = null

function openConfirmModal(msg, cb) { confirmMessage.value=msg; confirmCallback=cb; showConfirmModal.value=true }
function closeConfirmModal() { showConfirmModal.value=false; confirmMessage.value=''; confirmCallback=null }
function executeConfirm() { if (confirmCallback) confirmCallback(); closeConfirmModal() }

function handleKeydown(e) {
  if (e.key==='n'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!showCreateModal.value&&!showEditModal.value) showCreateModal.value=true
  if (e.key==='c'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!showCreateCafeModal.value&&!showEditCafeModal.value) showCreateCafeModal.value=true
  if (e.key==='Escape') { showCreateModal.value=false; showEditModal.value=false; showCreateCafeModal.value=false; showEditCafeModal.value=false }
}
onMounted(async () => { await userStore.init(); await loadUsers(); await loadCafes(); document.addEventListener('keydown',handleKeydown) })
onBeforeUnmount(() => { document.removeEventListener('keydown',handleKeydown) })

function handleUserUpdated() { loadUsers(); showEditModal.value=false }
function openEditModal(user) { selectedUser.value=user; showEditModal.value=true }
async function loadUsers() { try { allUsers.value=await userStore.fetchAllUsers() } catch(e) { console.error(e) } }
function confirmDeleteUser(user) { const n=`${user.firstName} ${user.lastName}`.trim()||user.username; openConfirmModal(`Удалить пользователя «${n}»? Связанное расписание будет удалено.`,()=>executeDeleteUser(user.id)) }
async function executeDeleteUser(id) { try { await userStore.deleteUser_store(id); toast.add({severity:'success',summary:'Успех',detail:'Пользователь удалён',life:3000}); await loadUsers() } catch(e) { toast.add({severity:'error',summary:'Ошибка',detail:e.response?.data?.message||'Ошибка удаления',life:5000}) } }
function handleCafeUpdated() { loadCafes(); showEditCafeModal.value=false }
function openEditCafeModal(cafe) { selectedCafe.value=cafe; showEditCafeModal.value=true }
async function loadCafes() { cafesLoading.value=true; try { cafes.value=await getAllCafes() } catch(e) { console.error(e) } finally { cafesLoading.value=false } }
function confirmDeleteCafe(cafe) { openConfirmModal(`Удалить кафе «${cafe.name}»? Связанное расписание будет удалено.`,()=>executeDeleteCafe(cafe.id)) }
async function executeDeleteCafe(id) { try { await deleteCafe(id); toast.add({severity:'success',summary:'Успех',detail:'Кафе удалено',life:3000}); await loadCafes() } catch(e) { toast.add({severity:'error',summary:'Ошибка',detail:e.response?.data?.message||'Ошибка удаления',life:5000}) } }
</script>

<style scoped>
.admin-panel-container { padding: 32px 20px; max-width: 1200px; margin: 0 auto; }
.page-header h1 { font-family: var(--font-display); font-size: 40px; font-weight: 600; line-height: 1.1; color: var(--color-ink); margin-bottom: 24px; }

.stat-tile { background: var(--color-surface-black); padding: 32px; text-align: center; margin-bottom: 2px; }
.stat-inner { }
.stat-value { font-family: var(--font-display); font-size: 48px; font-weight: 600; color: var(--color-body-on-dark); display: block; margin-bottom: 4px; }
.stat-label { font-size: 14px; color: var(--color-body-muted); }

.columns { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; align-items: start; }
.column { display: flex; flex-direction: column; gap: 10px; }
.column-actions { display: flex; justify-content: flex-start; }

.card-tile { background: var(--color-canvas); padding: 24px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-head h2 { font-family: var(--font-display); font-size: 21px; font-weight: 600; line-height: 1.19; letter-spacing: 0.231px; color: var(--color-ink); }
.card-badge { font-size: 12px; font-weight: 600; color: var(--color-ink-muted-48); padding: 4px 12px; border-radius: var(--rounded-pill); background: var(--color-canvas-parchment); }

.list-items { display: flex; flex-direction: column; gap: 6px; }
.list-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--color-surface-pearl); border-radius: var(--rounded-sm); transition: background 0.2s; }
.list-item:hover { background: var(--color-canvas-parchment); }

.item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.item-name { font-weight: 600; font-size: 14px; color: var(--color-ink); }
.item-sub { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-ink-muted-48); flex-wrap: wrap; }
.item-sep { color: var(--color-hairline); }
.item-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.role-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: var(--rounded-pill); letter-spacing: 0.02em; }
.role-USER_ADMIN { background: rgba(0,102,204,0.1); color: var(--color-primary); }
.role-CAFE_ADMIN { background: rgba(0,113,227,0.1); color: var(--color-primary-focus); }
.role-STAFF { background: rgba(48,209,88,0.12); color: #30d158; }

.item-actions { display: flex; gap: 6px; margin-left: 12px; flex-shrink: 0; }
.item-btn { width: 32px; height: 32px; border: none; border-radius: 50%; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: transparent; }
.item-btn.edit { color: var(--color-primary); background: rgba(0,102,204,0.08); }
.item-btn.edit:hover { background: rgba(0,102,204,0.15); }
.item-btn.delete { color: #ff3b30; background: rgba(255,59,48,0.08); }
.item-btn.delete:hover { background: rgba(255,59,48,0.15); }
.item-btn.delete:disabled { opacity: 0.3; cursor: not-allowed; }

.empty-content { text-align: center; padding: 32px 16px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--color-ink-muted-48); margin-bottom: 4px; }
.empty-desc { font-size: 13px; color: var(--color-ink-muted-48); }

.empty-section { background: var(--color-canvas); padding: 64px 24px; text-align: center; margin-bottom: 2px; }
.empty-section .empty-title { font-size: 24px; }
.empty-section .empty-desc { font-size: 15px; margin-top: 8px; }

.btn-pill { padding: 8px 20px; border: none; border-radius: var(--rounded-pill); background: var(--color-primary); color: var(--color-on-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; display: inline-flex; align-items: center; gap: 6px; }
.btn-pill:hover { opacity: 0.85; }
.btn-pill:active { transform: scale(0.95); }

.btn-pill-outline { padding: 8px 20px; border: 1px solid var(--color-primary); border-radius: var(--rounded-pill); background: transparent; color: var(--color-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; display: inline-flex; align-items: center; gap: 6px; }
.btn-pill-outline:hover { opacity: 0.7; }
.btn-pill-outline:active { transform: scale(0.95); }

.btn-danger { background: #ff3b30; }
.btn-danger:hover { opacity: 0.85; }

.sk-mb { margin-bottom: 8px; }

.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 20000; }
.confirm-card { background: var(--color-canvas); border-radius: var(--rounded-lg); width: 90%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.confirm-head { padding: 20px 24px 0; }
.confirm-head h3 { font-size: 18px; color: var(--color-ink); }
.confirm-body { padding: 16px 24px; }
.confirm-body p { font-size: 14px; color: var(--color-ink-muted-80); line-height: 1.5; }
.confirm-actions { display: flex; gap: 10px; padding: 0 24px 20px; }
.confirm-actions .btn-pill, .confirm-actions .btn-pill-outline { flex: 1; justify-content: center; }

@media (max-width: 1000px) { .columns { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .admin-panel-container { padding: 20px 12px; } .page-header h1 { font-size: 28px; } .list-item { flex-direction: column; align-items: flex-start; gap: 10px; } .item-actions { margin-left: 0; width: 100%; justify-content: flex-end; } }
</style>
