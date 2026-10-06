export type KnowledgeStatus = '已发布' | '待审核' | '处理中' | '失败'
export type PreviewDocument = {
  id: string
  name: string
  category: string
  format: 'PDF' | 'Markdown'
  version: string
  status: KnowledgeStatus
  updatedAt: string
  size: string
  location: string
  excerpt: string
  detail: string
}
export const previewDocuments: PreviewDocument[] = [
  {
    id: 'medical',
    name: '医疗保障条款（示例）',
    category: '医疗保障',
    format: 'PDF',
    version: 'v1.0',
    status: '已发布',
    updatedAt: '10 月 05 日',
    size: '1.2 MB',
    location: '第 3 页 · 2.1 保险责任',
    excerpt:
      '本段为虚构条款样例，用于展示医疗费用、免赔额和给付计算相关条款的解析与定位。',
    detail: '示例版本已发布，用于展示资料在问答中的引用方式。',
  },
  {
    id: 'disease',
    name: '疾病保障条款（示例）',
    category: '疾病保障',
    format: 'PDF',
    version: 'v1.0',
    status: '已发布',
    updatedAt: '10 月 05 日',
    size: '860 KB',
    location: '第 5 页 · 3.2 给付条件',
    excerpt: '本段为虚构条款样例，用于展示疾病定义、给付条件与对应原文位置。',
    detail: '示例版本已发布，用于展示不同资料类型的管理方式。',
  },
  {
    id: 'glossary',
    name: '保险术语说明（示例）',
    category: '基础知识',
    format: 'Markdown',
    version: 'v1.1',
    status: '待审核',
    updatedAt: '10 月 04 日',
    size: '24 KB',
    location: '第 2 节 · 术语说明',
    excerpt: '本段为示例解析结果。审核时可对照原文检查章节边界与内容完整性。',
    detail: '解析已完成，等待管理员核对。接入服务后可提交审核。',
  },
  {
    id: 'accident',
    name: '意外保障条款（示例）',
    category: '意外保障',
    format: 'PDF',
    version: 'v1.0',
    status: '处理中',
    updatedAt: '10 月 04 日',
    size: '2.4 MB',
    location: '尚无解析结果',
    excerpt: '',
    detail: '示例任务正在解析。接入服务后，此处会显示真实处理阶段。',
  },
  {
    id: 'guide',
    name: '保障范围说明（示例）',
    category: '基础知识',
    format: 'PDF',
    version: 'v1.0',
    status: '失败',
    updatedAt: '10 月 03 日',
    size: '540 KB',
    location: '尚无解析结果',
    excerpt: '',
    detail: '示例失败原因：未提取到可用文本。请检查是否为扫描文件。',
  },
]
