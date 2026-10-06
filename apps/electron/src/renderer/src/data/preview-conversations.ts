export type PreviewSource = {
  id: number
  title: string
  location: string
  version: string
  excerpt: string
}
export type PreviewConversation = {
  id: string
  title: string
  group: '今天' | '昨天'
  question: string
  introduction: string
  sections: { title: string; text: string; sourceId: number }[]
  closing: string
  sources: PreviewSource[]
}

export const previewConversations: PreviewConversation[] = [
  {
    id: 'example-medical',
    title: '医疗险和重疾险的区别',
    group: '今天',
    question: '医疗险和重疾险有什么区别？为什么常常一起讨论？',
    introduction:
      '可以先看“钱因为什么而给付”。在这份虚构示例资料里，两类保障采用了不同的给付方式。',
    sections: [
      {
        title: '医疗险 · 对应约定的医疗费用',
        text: '示例条款按符合约定的医疗费用计算保险金，还需要核对保障范围、免赔额和给付比例。',
        sourceId: 1,
      },
      {
        title: '重疾险 · 对应约定的疾病条件',
        text: '示例条款以达到约定的疾病条件为给付依据。判断时需要查看具体疾病定义与给付条件。',
        sourceId: 2,
      },
    ],
    closing:
      '比较实际产品时，要回到各自的完整条款。名称相似，不代表保障范围和给付条件相同。',
    sources: [
      {
        id: 1,
        title: '医疗保障条款（虚构示例）',
        location: '第 3 页 · 2.1 保险责任',
        version: '示例 v1.0',
        excerpt:
          '本示例约定，保险金按符合合同范围的医疗费用计算，并适用约定的免赔额及给付比例。此段仅用于展示引用界面，不对应任何真实保险产品。',
      },
      {
        id: 2,
        title: '疾病保障条款（虚构示例）',
        location: '第 5 页 · 3.2 给付条件',
        version: '示例 v1.0',
        excerpt:
          '本示例约定，达到合同列明的疾病定义及给付条件后，按约定的保险金额给付。此段仅用于展示引用界面，不对应任何真实保险产品。',
      },
    ],
  },
  {
    id: 'example-deductible',
    title: '条款里的免赔额怎么看',
    group: '今天',
    question: '看到条款里写着免赔额，应该从哪里开始看？',
    introduction:
      '可以把相关条款一起读，先找到免赔额的定义，再查看它如何参与保险金计算。下面使用虚构示例演示来源展示。',
    sections: [
      {
        title: '先看定义与计算周期',
        text: '示例资料在定义章节说明免赔额，并在给付计算章节说明它按什么周期累计。',
        sourceId: 1,
      },
      {
        title: '再核对例外与抵扣约定',
        text: '示例资料单独列出抵扣约定。实际判断时，应同时查阅保险责任及相关解释。',
        sourceId: 1,
      },
    ],
    closing:
      '如果继续提问，可以补充具体产品名称及条款版本，便于定位同一份资料。',
    sources: [
      {
        id: 1,
        title: '医疗保障条款（虚构示例）',
        location: '第 8 页 · 4.1 免赔额',
        version: '示例 v1.0',
        excerpt:
          '本段为虚构展示内容，用于演示免赔额定义、计算周期和条款定位的展示方式，不构成真实产品条款。',
      },
    ],
  },
  {
    id: 'example-terms',
    title: '怎么找到回答的条款依据',
    group: '昨天',
    question: '我想确认回答的依据，要怎么看引用的原文？',
    introduction:
      '每条回答的来源区域会列出资料名称与定位信息。你可以打开来源，对照对应的原文片段。',
    sections: [
      {
        title: '打开来源，核对上下文',
        text: '点击下方来源卡片，查看原文、页码或章节，以及回答绑定的资料版本。',
        sourceId: 1,
      },
    ],
    closing:
      '这里展示的是界面样例。接入服务后，来源内容与访问权限将由服务端确认。',
    sources: [
      {
        id: 1,
        title: '来源展示说明（虚构示例）',
        location: '第 1 节 · 引用核对',
        version: '示例 v1.0',
        excerpt:
          '引用应展示资料名称、原文片段、可核对的页码或章节定位，以及回答使用的资料版本。本段为界面展示样例。',
      },
    ],
  },
]
