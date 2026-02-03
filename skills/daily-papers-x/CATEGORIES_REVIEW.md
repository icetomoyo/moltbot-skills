# Daily Papers X - arXiv 类别清单

这是当前 daily-papers-x 技能中使用的所有 arXiv 类别。
请审核这些类别，标记需要删除或保留的，我会根据你的反馈更新代码。

---

## 主要研究方向 (Main Categories)

### 1. 人工智能 (AI & LLM)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| cs.AI | Artificial Intelligence | 人工智能核心类别 | 保留 |
| cs.LG | Machine Learning | 机器学习 | 保留 |
| cs.CL | Computation and Language (NLP) | 自然语言处理 | 保留 |
| cs.DB | Databases | 数据库 | 待审核 |
| cs.CR | Cryptography and Security | 密码学与安全 | 待审核 |
| cs.DS | Data Structures and Algorithms | 数据结构与算法 | 待审核 |
| cs.SE | Software Engineering | 软件工程 | 待审核 |

### 2. 具身智能 (Embodied AI)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| cs.RO | **Robotics** | 机器人学（核心） | 保留 ✅ |
| cs.CV | Computer Vision and Pattern Recognition | 计算机视觉 | 保留 |
| cs.GR | Graphics | 计算机图形学 | 待审核 |
| cs.SY | Systems and Control | 系统与控制 | 待审核 |

### 3. 多模态与视觉 (Multimodal & Vision)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| cs.CV | Computer Vision | 计算机视觉（与上面重复） | 待审核 |
| cs.MM | Multimedia | 多媒体 | 待审核 |
| cs.GR | Graphics | 图形学（与上面重复） | 待审核 |
| eess.IV | Image and Video Processing | 图像与视频处理 | 待审核 |

### 4. AI与金融结合 (AI + Finance)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| q-fin.CP | Computational Finance | 计算金融 | 保留 |
| q-fin.GN | General Finance | 一般金融 | 待审核 |
| q-fin.PM | Portfolio Management | 投资组合管理 | 待审核 |
| q-fin.ST | Statistical Finance | 统计金融 | 待审核 |
| q-fin.TR | Trading and Market Microstructure | 交易与市场微观结构 | 保留 |
| q-fin.EC | Economics | 经济学 | 待审核 |
| q-fin.MF | Mathematical Finance | 数学金融 | 待审核 |

### 5. AI与生物医学结合 (AI + Biomedical)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| q-bio.QM | Quantitative Methods | 定量生物学方法 | 保留 |
| q-bio.BM | Biomolecules | 生物分子 | 待审核 |
| q-bio.GN | Genomics | 基因组学 | 保留 |
| q-bio.TO | Tissues and Organs | 组织与器官 | 待审核 |
| q-bio.CB | Cell Behavior | 细胞行为 | 待审核 |
| q-bio.MN | Molecular Networks | 分子网络 | 待审核 |
| q-bio.SC | Subcellular Processes | 亚细胞过程 | 待审核 |

### 6. AI与科学计算 (AI + Science)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| cs.AI | Artificial Intelligence（与上面重复） | 人工智能 | 待审核 |
| cs.LG | Machine Learning（与上面重复） | 机器学习 | 待审核 |
| cs.NA | Numerical Analysis | 数值分析 | 待审核 |
| cs.SC | Scientific Computing | 科学计算 | 待审核 |
| physics.comp-ph | Computational Physics | 计算物理 | 待审核 |
| physics.chem-ph | Chemical Physics | 化学物理 | 待审核 |
| physics.ao-ph | Atmospheric and Oceanic Physics | 大气与海洋物理 | 待审核 |

---

## 辅助类别 (Broad Categories)

### 计算机科学 (Computer Science)
| 类别代码 | 全称 | 说明 | 建议 |
|---------|------|------|------|
| cs.CC | Computational Complexity | 计算复杂性 | 待审核 |
| cs.CE | Computational Engineering, Finance, and Science | 计算工程、金融与科学 | 待审核 |
| cs.CG | Computational Geometry | 计算几何 | 待审核 |
| cs.GT | Computer Science and Game Theory | 计算机科学与博弈论 | 待审核 |
| cs.HC | Human-Computer Interaction | 人机交互 | 待审核 |

---

## 审核说明

### 当前统计
- **总类别数**: 37 个
- **主要研究方向**: 6 个方向，32 个类别
- **辅助类别**: 5 个类别
- **重复的类别**: cs.AI, cs.LG, cs.CV, cs.GR（在多个方向中重复出现）

### 建议精简方向
1. **合并重复类别** - 同一类别出现在多个方向中时，只需保留一次
2. **删除过于基础的类别** - 如纯数学、纯理论计算机科学等
3. **专注 AI 相关** - 只保留与人工智能直接相关的类别

### 核心 AI 类别建议 (供参考)
```
必选：
- cs.AI (人工智能)
- cs.LG (机器学习)
- cs.CL (自然语言处理)
- cs.CV (计算机视觉)
- cs.RO (机器人学)
- cs.MM (多媒体)

可选：
- cs.IR (信息检索)
- cs.DB (数据库)
- cs.SE (软件工程)
- cs.CR (安全)
- cs.SY (系统控制)
```

---

## 请在下面标记你的决定

你可以直接编辑这个文件，在每行的「建议」列填入：
- `保留` - 保留这个类别
- `删除` - 删除这个类别
- `?` - 不确定，需要讨论

或者直接列出你想要的类别清单。
