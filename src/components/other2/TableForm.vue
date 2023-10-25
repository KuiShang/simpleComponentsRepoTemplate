<template>
  <div>
    <page-subtitle v-if="isShowSubtitle">
      <template slot="title" v-if="!title">
        <el-button :size="buttonSize" :type="buttonType" v-if="hasManagementAuth && showAddBtn" @click="handleAdd" :disabled="btnDisabled">{{ titleBtn }}</el-button>
      </template>
      <template v-else>
        <!-- @slot 标题插槽 -->
        <template slot="title">
          <el-tooltip effect="light" placement="top-start" :content="title" :disabled="disableTitleTooltip">
            <div class="page-title-content">
              <span ref="title">{{ title }}</span>
            </div>
          </el-tooltip>
        </template>
        <!-- @slot 搜索框插槽 -->
        <slot name="search"></slot>
        <el-button :size="buttonSize" :type="buttonType" v-if="hasManagementAuth && showAddBtn" @click="handleAdd" :disabled="btnDisabled">{{ titleBtn }}</el-button>
      </template>
      <!-- @slot 副标题插槽 -->
      <slot name="subtitle"></slot>
    </page-subtitle>
    <el-form :rules="rules" :model="form" ref="ruleform">
      <el-table
        ref="table"
        :height="tableFixedHeaderHeight"
        :data="data"
        :row-key="tableRowKey"
        :default-expand-all="isDefaultExpandAll"
        @row-click="rowClick"
        tooltip-effect="light"
        :highlight-current-row="highlightCurrentRow"
        :show-empty-operate="showInlineCreate"
        @click-empty-operate="handleClickEmptyOperate"
        @filter-change="handleFilterChange"
        @selection-change="handleSelectionChange"
        style="width: 100%">
        <el-table-column
          v-if="selectionState"
          type="selection"
          width="55">
        </el-table-column>
        <el-table-column
          :show-overflow-tooltip="item !== 'operation'"
          v-for="(item) in column"
          :key="item"
          :column-key="item"
          :label="labels[item]"
          :prop="item"
          :width="getWidth(item)"
          :label-class-name="item === 'operation' ? 'operation': ''"
          :filters="filtersListObj[item] || null"
        >
          <template slot="header">
            <slot name="header" :data="item"></slot>
          </template>
          <template slot-scope="{ row, $index }">
            <template v-if="item === 'operation' && hasManagementAuth">
              <btn-text-group v-if="row.edit">
                <el-button
                  type="text"
                  @click="handleSave(row, $index)"
                >{{ $t('button.save') }}</el-button>
                <el-button
                  type="text"
                  @click="handleCancel(row, $index)"
                >{{ $t('button.cancel') }}</el-button>
              </btn-text-group>
              <btn-text-group v-else>
                <template v-if="!row[hiddenRows]">
                  <el-button
                    v-if="showInlineCreate"
                    type="text"
                    @click="handleCreate(row)"
                    :disabled="btnDisabled"
                  >{{ $t('button.create') }}</el-button>
                  <el-button
                    v-if="showEditBtn"
                    type="text"
                    @click="handleEdit(row, $index)"
                    :disabled="btnDisabled || row.editBtnDisabled"
                  >{{ $t('button.edit') }}</el-button>
                  <el-button
                    v-if="showDeleteBtn"
                    type="text"
                    @click="handleDelete(row, $index)"
                    :disabled="btnDisabled || row.deleteBtnDisable"
                  >{{ $t('button.delete') }}</el-button>
                   <el-button
                    v-if="allowCreateChildRow(row)"
                    type="text"
                    @click="handleCreateChild(row)"
                    :disabled="btnDisabled"
                  >{{ $t('button.createChild') }}</el-button>
                </template>
                <slot name="moreOperations" :disabled="btnDisabled" :id="row.id" :row="row" :index="$index"></slot>
              </btn-text-group>
            </template>
            <template v-else-if="item === 'index'">
              <div class="cell serial-number">{{ $index + 1 }}</div>
            </template>
            <template v-else-if="item === 'checkicon'">
              <template v-if="row.id === rowId">
                <i class="el-icon-check"></i>
              </template>
              <template v-else></template>
            </template>
            <template v-else>
              <el-form-item
                :prop="item"
                v-if="row.edit"
                >
                <slot :data="item" :row="row" :index="$index"></slot>
              </el-form-item>
              <span v-else-if="selectGroup.includes(item)">
                {{ filterSelect(row[item], item) }}
              </span>
              <span v-else>
                <slot name="view" :data="item" :row="row" :index="$index">{{ row[item] }}</slot>
              </span>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </div>
</template>
<i18n src="./locales/table-form.json"></i18n>

<script>

const columnWidth = { operation: '200', index: '80', checkicon: '50' }
export default {
  name: 'other-com',
  components: {
  },
  props: {
    /**
     * 新建按钮类型
     */
    buttonType: {
      type: String,
      default: 'default'
    },
    /**
     * 新建按钮大小
     */
    buttonSize: {
      type: String,
      default: 'small'
    },
    /**
     * 新建行位于table底部
     */
    addPositionBottom: {
      type: Boolean,
      default: true
    },
    /**
     * table是否显示复选框
     */
    selectionState: {
      type: Boolean,
      default: false
    },
    /**
     * table复选框默认选中的值
     */
    selectionRows: {
      type: Array,
      default: () => {
        return []
      }
    },
    /**
     * 固定表头传入height
     */
    tableFixedHeaderHeight: {
      type: String,
      default: ''
    },
    /**
     * 标题名称
     */
    title: String,
    /**
     * 新建按钮名称
     */
    titleBtn: String,
    /**
     * 表格数据
     */
    tableData: Array,
    /**
     * 表单验证规则
     */
    rules: Object,
    /**
     * 要提交的表单数据 -- 注 输入的是新增时要提交的表单数据结构
     */
    initForm: Object,
    /**
      * 表格表头参数- 数组(以下例子参考租户管理模块联系人列表)
      * column: ['name', 'mobileNumber', 'memo', 'operation'],
    */
    column: Array,
    /**
      表格表头名称 (以下例子参考租户管理模块联系人列表)
      memo: "备注"
      mobileNumber: "手机号"
      name: "姓名"
      operation: "操作"
    */
    labels: Object,
    /**
     * 是否高亮当前行
     */
    highlightCurrentRow: {
      type: Boolean,
      default: false
    },
    /**
      * 表格存在下拉选项
    */
    selectGroup: {
      type: Array,
      default: () => {
        return []
      }
    },
    /**
     * 过滤下拉选择值函数
     */
    filterSelect: Function,
    /**
     * 权限控制
     */
    hasManagementAuth: {
      type: Boolean,
      default: true
    },
    /**
     * 是否为本地保存
     */
    localSave: {
      type: Boolean,
      default: false
    },
    /**
     * 表格选中行的值
     */
    rowId: [Number, String],
    setCurrentRow: {
      type: Boolean,
      default: false
    },
    /**
     * 操作列是否显示删除按钮
     */
    showDeleteBtn: {
      type: Boolean,
      default: true
    },
    /**
     * 操作列是否显示编辑按钮
     */
    showEditBtn: {
      type: Boolean,
      default: true
    },
    /**
     * 表格上方是否显示新建按钮
     */
    showAddBtn: {
      type: Boolean,
      default: true
    },
    /**
     * row.hiddenRows的默认值若是hiddenRow则隐藏操作列
     */
    hiddenRows: {
      type: String,
      default: 'hiddenRow'
    },
    /**
     * 是否在行内操作列显示新建按钮
     */
    showInlineCreate: {
      type: Boolean,
      default: false
    },
    /**
     * 每行数据的主键
     */
    tableRowKey: {
      type: String,
      default: 'onlyId'
    },
    /**
     * 树形结构的表格数据是否默认展开全部
     */
    isDefaultExpandAll: {
      type: Boolean,
      default: true
    },
    /**
     * 树形结构的表格数据是否允许新建子节点
     */
    allowCreateChildRow: {
      type: Function,
      default: function () { }
    },
    /**
     * 每列宽度
     */
    columnWidth: {
      type: Object,
      default: () => ({})
    },
    /**
     * 是否显示副标题
     */
    isShowSubtitle: {
      type: Boolean,
      default: true
    },
    filtersListObj: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      btnDisabled: false,
      data: [],
      form: {},
      init: null,
      isSavedFlag: true,
      disableTitleTooltip: true,
      multipleSelection: []
    }
  },
  watch: {
    tableData: {
      handler: function (value) {
        if (value.length) {
          this.handleTableRowKeyOfTableTree(value, this.tableRowKey, 'add')
        }
        this.data = value
      },
      deep: true,
      immediate: true
    },
    initForm: {
      handler: function (value) {
        this.$nextTick(() => {
          this.form = { ...value } // 给表单赋值
        })
      },
      deep: true,
      immediate: true
    },
    selectionRows: {
      handler: function (value) {
        if (value.length) {
          this.tableData.forEach(item => {
            value.forEach(row => {
              if (item.id === row.id) {
                this.$refs.table.toggleRowSelection(item, true)
              }
            })
          })
        }
      },
      deep: true,
      immediate: true
    }
  },
  created () {
    this.data = this.tableData
    this.tableColumnWidth = Object.assign({}, columnWidth, this.columnWidth)
  },
  updated () {
    if (this.setCurrentRow) {
      this.setCurrent()
    }
    this.$nextTick(() => {
      const titleDom = this.$refs.title
      if (this.title && titleDom) {
        this.disableTitleTooltip = titleDom.offsetWidth <= titleDom.parentNode.offsetWidth
      }
    })
  },
  methods: {
    handleSelectionChange (val) {
      this.multipleSelection = val
    },
    getSelectionData () {
      return this.multipleSelection
    },
    setInitForm (form) {
      this.init = { ...form }
    },
    handleAdd (row) {
      if (!this.init) {
        this.setInitForm(this.form)
      }
      const rowItem = {
        ...this.form,
        edit: true
      }
      rowItem[this.tableRowKey] = this.getUniqueFrontId()

      if (row && row[this.tableRowKey]) {
        const { children, currentIndex } = this.findParentAndIndexbyKey(this.data, this.tableRowKey, row[this.tableRowKey])
        children.splice(currentIndex + 1, 0, rowItem)
      } else {
        if (this.addPositionBottom) {
          this.data.push(rowItem)
        } else {
          this.data.unshift(rowItem)
        }
      }

      this.$emit('update:initForm', { ...rowItem })
      this.$emit('add', rowItem)
      this.btnDisabled = true
      this.isSavedFlag = false
    },
    handleCreateChild (row) {
      if (!this.init) {
        this.setInitForm(this.form)
      }
      const newChild = {
        ...this.form,
        edit: true
      }

      newChild[this.tableRowKey] = this.getUniqueFrontId()

      if (!row.children) {
        this.$set(row, 'children', [])
      }
      row.children.push(newChild)
      this.$emit('update:initForm', { ...newChild })
      this.btnDisabled = true
      this.isSavedFlag = false
    },
    handleEdit (row, index) {
      if (!this.init) {
        this.setInitForm(this.form)
      }
      const data = {
        ...row,
        edit: true
      }
      if (!data[this.tableRowKey]) {
        data[this.tableRowKey] = this.getUniqueFrontId()
      }
      this.form = {
        ...row,
        edit: true
      }
      const { children, currentIndex } = this.findParentAndIndexbyKey(this.data, this.tableRowKey, row[this.tableRowKey])
      this.$set(children, currentIndex, data)
      this.btnDisabled = true
      this.isSavedFlag = true
      this.$emit('update:initForm', { ...this.form })
      this.$emit('edit', row, index)
    },
    handleCancel (row, index) {
      const { children, currentIndex } = this.findParentAndIndexbyKey(this.data, this.tableRowKey, row[this.tableRowKey])
      if (this.isSavedFlag && row.id) {
        children[currentIndex].edit = false
      } else {
        children.splice(currentIndex, 1)
      }
      this.btnDisabled = false
      this.resetForm()
      this.$emit('cancel', row, index)
    },
    handleSave (row, index) {
      // 表单验证
      let rows = row
      this.$refs.ruleform.validate((valid) => {
        if (valid) {
          if (this.localSave) {
            
            const data = {
              ...this.initForm,
              edit: true
            }

            const { children, currentIndex } = this.findParentAndIndexbyKey(this.data, this.tableRowKey, row[this.tableRowKey])
            this.$set(children, currentIndex, data)

            rows = this.initForm
          }
          // this.btnDisabled = false
          this.form.edit && delete this.form.edit
          this.form.onlyId && delete this.form.onlyId
          this.$emit('update:initForm', { ...this.form })
          this.$emit('save', rows, index)
          this.isSavedFlag = true
        } else {
          return false
        }
      })
    },
    handleDelete (row, index) {
      if (this.localSave) {
        this.$emit('delete', {
          data: row,
          index: index
        })
      } else {
        this.$emit('delete', row)
      }
    },
    handleCreate (row) {
      this.handleAdd(row)
    },
    resetForm () {
      // 设置新增标识
      this.btnDisabled = false
      this.$refs.ruleform.resetFields()
      this.form = { ...this.init }
      this.$emit('update:initForm', { ...this.form })
    },
    rowClick (row ) {
      !row.edit && this.$emit('rowClick', row)
    },
    setCurrent () {
      const currentRow = this.findParentAndIndexbyKey(this.data, this.tableRowKey, this.rowId)
      if (currentRow) {
        const { children, currentIndex } = this.findParentAndIndexbyKey(this.data, this.tableRowKey, this.rowId)
        this.$refs.table.setCurrentRow(children[currentIndex])
      }
    },
    resetBtnDisabled () {
      this.btnDisabled = false
    },
    setBtnDisabled () {
      this.btnDisabled = true
    },
    resetFormFields () {
      this.$refs.ruleform.resetFields()
    },
    getWidth (item) {
      return this.tableColumnWidth[item] || ''
    },
    handleClickEmptyOperate () {
      this.handleAdd()
    },
    findParentAndIndexbyKey (tree, key, value) {
      const treeIsArray = Array.isArray(tree)
      const arr = treeIsArray ? tree : tree.children
      for (let index = 0; index < arr.length; index++) {
        if (arr[index][key] === value) {
          const parentNode = treeIsArray ? null : tree
          return { parentNode, children: arr, currentIndex: index }
        } else if (arr[index].children) {
          const result = this.findParentAndIndexbyKey(arr[index], key, value)
          if (result) return result
        }
      }
    },
    getUniqueFrontId () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    handleTableRowKeyOfTableTree (tree, key, operation) {
      const treeIsArray = Array.isArray(tree)
      const arr = treeIsArray ? tree : tree.children
      if (arr && arr.length) {
        for (let index = 0; index < arr.length; index++) {
          const obj = arr[index]
          const isHasKeyFlag = key in obj
          if (operation === 'delete' && isHasKeyFlag) {
            delete obj[key]
          } else if (operation === 'add' && !isHasKeyFlag) {
            obj[key] = this.getUniqueFrontId()
          }
          if (obj.children && obj.children.length) {
            this.handleTableRowKeyOfTableTree(obj, key, operation)
          }
        }
        return tree
      }
    },
    handleFilterChange (filterObj) {
      this.$emit('filter-change', filterObj)
    }
  }
}
</script>

<style scoped lang="scss">
.el-table {
  /deep/ td {
    padding: 0;
    .cell {
      padding:12px 10px;
    }
    .serial-number {
      padding: 0 10px;
    }
    > span {
      display: block;
      padding: 0 10px;
    }
  }
  .el-form-item {
    display: inline-block;
    margin-top: 4px;
    margin-bottom: 4px;
  }
}
.el-icon-check{
  cursor: pointer;
  color: #1890FF;
}
.page-title-content{
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
}
</style>
