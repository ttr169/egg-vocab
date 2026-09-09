/* ============================================================
   蛋仔单词本 · 日语课本词库
   《Adventures in Japanese 1》Lesson 3 「Family / かぞく」
   覆盖 Part 1-5 全部词汇 + Additional Vocabulary + 助数词
   字段：cn=中文释义, reading=罗马字读音, kanji=汉字写法,
        pos=课本分组, examples=[{en:日语例句, cn:中文翻译}]
   ============================================================ */

window.SEED_WORDS = {

  /* ══════════ Part 1 · 我的家庭 (p84-85) ══════════ */
  "かぞく": {
    cn: "（我的）家人；家庭", reading: "kazoku", kanji: "家族", pos: "Part 1 · 家庭",
    examples: [
      { en: "これは わたしの かぞくの しゃしんです。", cn: "这是我家人的照片。" },
      { en: "かぞくは ろくにんです。", cn: "我家有六口人。" }
    ]
  },
  "きょうだい": {
    cn: "（我的）兄弟姐妹", reading: "kyoodai", kanji: "兄弟", pos: "Part 1 · 家庭",
    examples: [{ en: "きょうだいは いますか。", cn: "你有兄弟姐妹吗？" }]
  },
  "なまえ": {
    cn: "名字", reading: "namae", kanji: "名前", pos: "Part 1 · 家庭",
    examples: [{ en: "あにの なまえは マイクです。", cn: "我哥哥的名字叫迈克。" }]
  },
  "だれ": {
    cn: "谁", reading: "dare", pos: "Part 1 · 家庭",
    examples: [{ en: "この ひとは だれですか。", cn: "这个人是谁？" }]
  },

  /* ── 人数助数词 (Counters: People) ── */
  "ひとり": { cn: "一个人（不规则）", reading: "hitori", kanji: "一人", pos: "Part 1 · 人数", examples: [{ en: "ひとりで すんでいます。", cn: "一个人住。" }] },
  "ふたり": { cn: "两个人（不规则）", reading: "futari", kanji: "二人", pos: "Part 1 · 人数", examples: [{ en: "ふたりで いきます。", cn: "两个人去。" }] },
  "さんにん": { cn: "三个人", reading: "san-nin", kanji: "三人", pos: "Part 1 · 人数", examples: [{ en: "かぞくは さんにんです。", cn: "我家三口人。" }] },
  "よにん": { cn: "四个人（不规则：よ＋にん）", reading: "yo-nin", kanji: "四人", pos: "Part 1 · 人数", examples: [{ en: "よにんの かぞくです。", cn: "是四口人的家庭。" }] },
  "ごにん": { cn: "五个人", reading: "go-nin", kanji: "五人", pos: "Part 1 · 人数", examples: [{ en: "ごにんは います。", cn: "有五个人。" }] },
  "ろくにん": { cn: "六个人", reading: "roku-nin", kanji: "六人", pos: "Part 1 · 人数", examples: [{ en: "かぞくは ろくにんです。", cn: "我家六口人。" }] },
  "ななにん": { cn: "七个人（なな／しちにん）", reading: "nana/shichi-nin", kanji: "七人", pos: "Part 1 · 人数", examples: [{ en: "ななにんの かぞくです。", cn: "是七口人的家庭。" }] },
  "はちにん": { cn: "八个人", reading: "hachi-nin", kanji: "八人", pos: "Part 1 · 人数", examples: [{ en: "へやに はちにんが います。", cn: "房间里有八个人。" }] },
  "きゅうにん": { cn: "九个人", reading: "kyuu-nin", kanji: "九人", pos: "Part 1 · 人数", examples: [{ en: "きゅうにんの ともだちが います。", cn: "有九个朋友。" }] },
  "じゅうにん": { cn: "十个人", reading: "juu-nin", kanji: "十人", pos: "Part 1 · 人数", examples: [{ en: "じゅうにん います。", cn: "有十个人。" }] },
  "じゅういちにん": { cn: "十一个人", reading: "juuichi-nin", kanji: "十一人", pos: "Part 1 · 人数", examples: [{ en: "クラスに じゅういちにん います。", cn: "班里有十一个人。" }] },
  "なんにん": { cn: "几个人？", reading: "nan-nin", kanji: "何人", pos: "Part 1 · 人数", examples: [{ en: "ごかぞくは なんにん ですか。", cn: "您家有几口人？" }] },

  /* ── 年龄助数词 (Counters: Ages) ── */
  "いっさい": { cn: "一岁（不规则）", reading: "issai", kanji: "一歳", pos: "Part 1 · 年龄", examples: [{ en: "あかんぼうは いっさいです。", cn: "宝宝一岁。" }] },
  "にさい": { cn: "两岁", reading: "ni-sai", kanji: "二歳", pos: "Part 1 · 年龄", examples: [{ en: "いもうとは にさいです。", cn: "妹妹两岁。" }] },
  "さんさい": { cn: "三岁", reading: "san-sai", kanji: "三歳", pos: "Part 1 · 年龄", examples: [{ en: "こどもは さんさいです。", cn: "孩子三岁。" }] },
  "よんさい": { cn: "四岁", reading: "yon-sai", kanji: "四歳", pos: "Part 1 · 年龄", examples: [{ en: "おとうとは よんさいです。", cn: "弟弟四岁。" }] },
  "ごさい": { cn: "五岁", reading: "go-sai", kanji: "五歳", pos: "Part 1 · 年龄", examples: [{ en: "いもうとは ごさいです。", cn: "妹妹五岁。" }] },
  "ろくさい": { cn: "六岁", reading: "roku-sai", kanji: "六歳", pos: "Part 1 · 年龄", examples: [{ en: "ろくさいの こども", cn: "六岁的孩子" }] },
  "ななさい": { cn: "七岁", reading: "nana-sai", kanji: "七歳", pos: "Part 1 · 年龄", examples: [{ en: "ななさいに なりました。", cn: "满七岁了。" }] },
  "はっさい": { cn: "八岁（不规则）", reading: "hassai", kanji: "八歳", pos: "Part 1 · 年龄", examples: [{ en: "はっさいの おとうと", cn: "八岁的弟弟" }] },
  "きゅうさい": { cn: "九岁（不要读 kusai！）", reading: "kyuu-sai", kanji: "九歳", pos: "Part 1 · 年龄", examples: [{ en: "きゅうさいです。", cn: "九岁。" }] },
  "じゅっさい": { cn: "十岁（不规则）", reading: "juu-sai", kanji: "十歳", pos: "Part 1 · 年龄", examples: [{ en: "じゅっさいの いもうと", cn: "十岁的妹妹" }] },
  "じゅういっさい": { cn: "十一岁（不规则）", reading: "juuissai", kanji: "十一歳", pos: "Part 1 · 年龄", examples: [{ en: "じゅういっさいです。", cn: "十一岁。" }] },
  "はたち": { cn: "二十岁（不规则，不说 にじゅっさい）", reading: "hatachi", kanji: "二十歳", pos: "Part 1 · 年龄", examples: [{ en: "あねは はたちです。", cn: "姐姐二十岁。" }] },
  "なんさい": { cn: "几岁？", reading: "nan-sai", kanji: "何歳", pos: "Part 1 · 年龄", examples: [{ en: "いもうとは なんさいですか。", cn: "妹妹几岁了？" }] },
  "おいくつ": { cn: "几岁？（礼貌说法）", reading: "o-ikutsu", pos: "Part 1 · 年龄", examples: [{ en: "おいくつですか。", cn: "您今年多大年纪？" }] },

  /* ── Part 1 句型词 ── */
  "そうですか": { cn: "是这样啊；是嘛", reading: "soo desu ka", pos: "Part 1 · 句型", examples: [{ en: "——けんさんは 中学生です。——そうですか。", cn: "——小健是中学生。——是这样啊。" }] },
  "ほんとうですか": { cn: "是真的吗？真的吗？", reading: "hontoo desu ka", kanji: "本当ですか", pos: "Part 1 · 句型", examples: [{ en: "——母は いしゃです。——ほんとうですか。", cn: "——我妈妈是医生。——真的吗？" }] },
  "の": { cn: "助词「的」表示所属/描述", reading: "no", pos: "Part 1 · 句型", examples: [{ en: "これは にほんごの ほんです。", cn: "这是一本日语书。" }] },

  /* ── Part 1 Additional Vocabulary ── */
  "いぬ": { cn: "狗", reading: "inu", kanji: "犬", pos: "Part 1 · 补充词", examples: [{ en: "いぬが すきです。", cn: "喜欢狗。" }] },
  "ねこ": { cn: "猫", reading: "neko", kanji: "猫", pos: "Part 1 · 补充词", examples: [{ en: "ねこを かっています。", cn: "养了一只猫。" }] },
  "どなた": { cn: "谁（だれ 的礼貌说法）", reading: "donata", pos: "Part 1 · 补充词", examples: [{ en: "あのかたは どなたですか。", cn: "那位是谁？" }] },
  "ペット": { cn: "宠物", reading: "petto", pos: "Part 1 · 补充词", examples: [{ en: "ペットは いますか。", cn: "有宠物吗？" }] },
  "ぎりの～": { cn: "姻亲的～（如 ぎりのはは 岳母/婆婆）", reading: "giri no ~", pos: "Part 1 · 补充词", examples: [{ en: "ぎりの ははは 40さいです。", cn: "岳母四十岁。" }] },
  "うえの～": { cn: "两个中较大的～（姐/哥）", reading: "ue no ~", pos: "Part 1 · 补充词", examples: [{ en: "うえの あに", cn: "两个哥哥中较大的" }] },
  "したの～": { cn: "两个中较小的～（弟/妹）", reading: "shita no ~", pos: "Part 1 · 补充词", examples: [{ en: "したの いもうと", cn: "两个妹妹中较小的" }] },
  "そふ": { cn: "（我的）爷爷；外公", reading: "sofu", kanji: "祖父", pos: "Part 1 · 补充词", examples: [{ en: "そふは 70さいです。", cn: "我爷爷七十岁。" }] },
  "そぼ": { cn: "（我的）奶奶；外婆", reading: "sobo", kanji: "祖母", pos: "Part 1 · 补充词", examples: [{ en: "そぼは やさしいです。", cn: "我奶奶很和蔼。" }] },

  /* ══════════ Part 2 · 朋友的家庭 (p90-91) ══════════ */
  "おとうさん": { cn: "（别人的）爸爸", reading: "otoosan", kanji: "お父さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おとうさんは なんさいですか。", cn: "您爸爸多大了？" }] },
  "おかあさん": { cn: "（别人的）妈妈", reading: "okaasan", kanji: "お母さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おかあさん、おはよう。", cn: "妈妈，早上好。（称呼自己妈妈时也用）" }] },
  "おじいさん": { cn: "（别人的）爷爷；老爷爷", reading: "ojiisan", kanji: "お祖父さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おじいさんは 65さいです。", cn: "爷爷六十五岁。" }] },
  "おばあさん": { cn: "（别人的）奶奶；老奶奶", reading: "obaasan", kanji: "お祖母さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おばあさんは やさしいです。", cn: "奶奶很慈祥。" }] },
  "おにいさん": { cn: "（别人的）哥哥", reading: "oniisan", kanji: "お兄さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おにいさんは 中学生です。", cn: "（你）哥哥是中学生。" }] },
  "おねえさん": { cn: "（别人的）姐姐", reading: "oneesan", kanji: "お姉さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おねえさんの なまえは 何ですか。", cn: "（你）姐姐叫什么名字？" }] },
  "おとうとさん": { cn: "（别人的）弟弟", reading: "otootosan", kanji: "お弟さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おとうとさんは 何さいですか。", cn: "（你）弟弟几岁？" }] },
  "いもうとさん": { cn: "（别人的）妹妹", reading: "imootosan", kanji: "お妹さん", pos: "Part 2 · 朋友的家庭", examples: [{ en: "いもうとさんは なんねんせいですか。", cn: "（你）妹妹几年级？" }] },
  "と": { cn: "和（连接名词）", reading: "to", pos: "Part 2 · 朋友的家庭", examples: [{ en: "父と 母と わたしです。", cn: "是爸爸、妈妈和我。" }] },
  "ごかぞく": { cn: "（您的）家人（礼貌）", reading: "gokazoku", kanji: "ご家族", pos: "Part 2 · 朋友的家庭", examples: [{ en: "ごかぞくは なんにんですか。", cn: "您家有几口人？" }] },
  "おなまえ": { cn: "（您的）名字（礼貌）", reading: "onamae", kanji: "お名前", pos: "Part 2 · 朋友的家庭", examples: [{ en: "おなまえは？", cn: "您叫什么名字？" }] },
  "そして": { cn: "然后；而且（只用于句首）", reading: "soshite", pos: "Part 2 · 朋友的家庭", examples: [{ en: "母は 今 しゅふです。そして、まえ 先生でした。", cn: "妈妈现在是家庭主妇。而且，以前是老师。" }] },
  "おじさん": { cn: "叔叔；舅舅（中年男子）", reading: "ojisan", kanji: "おじさん", pos: "Part 2 · 补充词", examples: [{ en: "おじさんは こうむいんです。", cn: "叔叔是公务员。" }] },
  "おばさん": { cn: "阿姨；姑姑（中年女子）", reading: "obasan", kanji: "おばさん", pos: "Part 2 · 补充词", examples: [{ en: "おばさんは かんごしです。", cn: "阿姨是护士。" }] },
  "いとこ": { cn: "表（堂）兄弟姐妹", reading: "itoko", kanji: "従兄弟", pos: "Part 2 · 补充词", examples: [{ en: "いとこは 高校生です。", cn: "表哥是高中生。" }] },

  /* ══════════ Part 3 · 你上几年级 (p95-96) ══════════ */
  "がっこう": { cn: "学校", reading: "gakkoo", kanji: "学校", pos: "Part 3 · 学校年级", examples: [{ en: "がっこうは どこですか。", cn: "学校在哪里？" }] },
  "せいと": { cn: "中小学生； pupil", reading: "seito", kanji: "生徒", pos: "Part 3 · 学校年级", examples: [{ en: "この がっこうの せいとです。", cn: "是这所学校的学生。" }] },
  "がくせい": { cn: "大学生", reading: "gakusei", kanji: "学生", pos: "Part 3 · 学校年级", examples: [{ en: "だいがくの がくせいです。", cn: "是大学生。" }] },
  "ちゅうがく": { cn: "中学（初中）", reading: "chuugaku", kanji: "中学", pos: "Part 3 · 学校年级", examples: [{ en: "ちゅうがくの せいとです。", cn: "是中学生。" }] },
  "こうこう": { cn: "高中", reading: "kookoo", kanji: "高校", pos: "Part 3 · 学校年级", examples: [{ en: "きょうこ高校です。", cn: "是高中。（例：京王高校）" }] },
  "ちゅうがくせい": { cn: "中学生", reading: "chuugakusei", kanji: "中学生", pos: "Part 3 · 学校年级", examples: [{ en: "ぼくは ちゅうがくせいです。", cn: "我是中学生。" }] },
  "こうこうせい": { cn: "高中生", reading: "kookoosei", kanji: "高校生", pos: "Part 3 · 学校年级", examples: [{ en: "ケンさんは こうこうせいですか。", cn: "小健是高中生吗？" }] },
  "ちゅうがくいちねんせい": { cn: "中学一年级（=美国7年级）", reading: "chuugaku ichinensei", kanji: "中学一年生", pos: "Part 3 · 学校年级", examples: [{ en: "ちゅうがく いちねんせいです。", cn: "我是中学一年级学生。" }] },
  "ちゅうがくにねんせい": { cn: "中学二年级（=8年级）", reading: "chuugaku ninensei", kanji: "中学二年生", pos: "Part 3 · 学校年级", examples: [{ en: "ちゅうがく にねんせいです。", cn: "我是中学二年级学生。" }] },
  "ちゅうがくさんねんせい": { cn: "中学三年级（=9年级/freshman）", reading: "chuugaku sannensei", kanji: "中学三年生", pos: "Part 3 · 学校年级", examples: [{ en: "何年生ですか。——ちゅうがく さんねんせいです。", cn: "几年级？——中学三年级。" }] },
  "こうこういちねんせい": { cn: "高中一年级（=10年级）", reading: "kookoo ichinensei", kanji: "高校一年生", pos: "Part 3 · 学校年级", examples: [{ en: "にほんの こうこう いちねんせいです。", cn: "是日本高中一年级学生。" }] },
  "こうこうにねんせい": { cn: "高中二年级（=11年级/junior）", reading: "kookoo ninensei", kanji: "高校二年生", pos: "Part 3 · 学校年级", examples: [{ en: "こうこう にねんせいです。", cn: "我是高中二年级。" }] },
  "こうこうさんねんせい": { cn: "高中三年级（=12年级/senior）", reading: "kookoo sannensei", kanji: "高校三年生", pos: "Part 3 · 学校年级", examples: [{ en: "こうこう さんねんせいです。", cn: "我是高中三年级。" }] },
  "なんねんせい": { cn: "几年级？", reading: "nan-nensei", kanji: "何年生", pos: "Part 3 · 学校年级", examples: [{ en: "おなまえは？　なんねんせいですか。", cn: "叫什么名字？几年级？" }] },
  "～も": { cn: "～也（助词）", reading: "~mo", kanji: "～も", pos: "Part 3 · 学校年级", examples: [{ en: "わたしも 中学三年生です。", cn: "我也是中学三年级。" }] },
  "だいがく": { cn: "大学；学院", reading: "daigaku", kanji: "大学", pos: "Part 3 · 补充词", examples: [{ en: "だいがくに いきます。", cn: "上大学。" }] },
  "だいがくせい": { cn: "大学生", reading: "daigakusei", kanji: "大学生", pos: "Part 3 · 补充词", examples: [{ en: "あには だいがくせいです。", cn: "哥哥是大学生。" }] },
  "しょうがっこう": { cn: "小学", reading: "shoogakkoo", kanji: "小学校", pos: "Part 3 · 补充词", examples: [{ en: "しょうがっこうの せいと", cn: "小学生" }] },
  "しょうがくせい": { cn: "小学生", reading: "shoogakusei", kanji: "小学校生徒", pos: "Part 3 · 补充词", examples: [{ en: "しょうがくせいです。", cn: "是小学生。" }] },
  "ようちえん": { cn: "幼儿园", reading: "yootchien", kanji: "幼稚園", pos: "Part 3 · 补充词", examples: [{ en: "ようちえんの こども", cn: "幼儿园的孩子" }] },
  "ほいくえん": { cn: "保育园；托儿所（preschool）", reading: "hoikuen", kanji: "保育園", pos: "Part 3 · 补充词", examples: [{ en: "ほいくえんに いきます。", cn: "上保育园。" }] },

  /* ══════════ Part 4 · 国籍 (p102-103) ══════════ */
  "どこ": { cn: "哪里；哪儿", reading: "doko", pos: "Part 4 · 国籍", examples: [{ en: "がっこうは どこですか。", cn: "学校在哪里？" }] },
  "こちら": { cn: "这位；这边（礼貌，指人用こちら）", reading: "kochira", pos: "Part 4 · 国籍", examples: [{ en: "こちらは なかむら あきこさんです。", cn: "这位是中村明子小姐。" }] },
  "にほん": { cn: "日本", reading: "Nihon", kanji: "日本", pos: "Part 4 · 国籍", examples: [{ en: "にほんの こうこうです。", cn: "是日本的高中。" }] },
  "にほんじん": { cn: "日本人（日本公民）", reading: "Nihon-jin", kanji: "日本人", pos: "Part 4 · 国籍", examples: [{ en: "なかむらさんは にほんじんです。", cn: "中村小姐是日本人。" }] },
  "アメリカ": { cn: "美国；美利坚", reading: "Amerika", pos: "Part 4 · 国籍", examples: [{ en: "アメリカから きました。", cn: "来自美国。" }] },
  "アメリカじん": { cn: "美国人", reading: "Amerika-jin", kanji: "アメリカ人", pos: "Part 4 · 国籍", examples: [{ en: "エミさんは アメリカじんです。", cn: "艾米是美国公民。" }] },
  "なにじん": { cn: "哪国人？什么国籍？", reading: "Nani-jin", kanji: "何人", pos: "Part 4 · 国籍", examples: [{ en: "なにじん ですか。", cn: "你是哪国人？" }] },
  "ちゅうごく": { cn: "中国", reading: "Chuugoku", kanji: "中国", pos: "Part 4 · 国籍", examples: [{ en: "ちゅうごくじんです。", cn: "是中国人。" }] },
  "かんこく": { cn: "韩国", reading: "Kankoku", kanji: "韓国", pos: "Part 4 · 国籍", examples: [{ en: "かんこくごを べんきょうします。", cn: "学习韩语。" }] },
  "フランス": { cn: "法国", reading: "Furansu", pos: "Part 4 · 国籍", examples: [{ en: "フランスの こうこうです。", cn: "是法国的高中。" }] },
  "スペイン": { cn: "西班牙", reading: "Supein", pos: "Part 4 · 国籍", examples: [{ en: "スペインじんです。", cn: "是西班牙人。" }] },
  "インド": { cn: "印度", reading: "Indo", pos: "Part 4 · 国籍", examples: [{ en: "インドから きました。", cn: "来自印度。" }] },
  "ブラジル": { cn: "巴西", reading: "Burajiru", pos: "Part 4 · 国籍", examples: [{ en: "ブラジルの だいがくです。", cn: "是巴西的大学。" }] },
  "ロシア": { cn: "俄罗斯", reading: "Roshia", pos: "Part 4 · 补充词", examples: [{ en: "ロシアじんです。", cn: "是俄罗斯人。" }] },
  "イギリス": { cn: "英国；英格兰", reading: "Igirisu", pos: "Part 4 · 补充词", examples: [{ en: "イギリスから きました。", cn: "来自英国。" }] },
  "ドイツ": { cn: "德国", reading: "Doitsu", pos: "Part 4 · 补充词", examples: [{ en: "ドイツのごかぞくです。", cn: "是德国家庭。" }] },
  "メキシコ": { cn: "墨西哥", reading: "Mekishiko", pos: "Part 4 · 补充词", examples: [{ en: "メキシコじんです。", cn: "是墨西哥人。" }] },
  "フィリピン": { cn: "菲律宾", reading: "Firipin", pos: "Part 4 · 补充词", examples: [{ en: "フィリピンの がっこうです。", cn: "是菲律宾的学校。" }] },
  "ナイジェリア": { cn: "尼日利亚", reading: "Naijeria", pos: "Part 4 · 补充词", examples: [{ en: "ナイジェリアから きました。", cn: "来自尼日利亚。" }] },
  "にっけいじん": { cn: "日系人（日裔，如日裔美国人）", reading: "Nikkeijin", kanji: "日系人", pos: "Part 4 · 补充词", examples: [{ en: "にっけいじんの アメリカじんです。", cn: "是日裔美国人。" }] },

  /* ══════════ Part 5 · 职业 (p105-106) ══════════ */
  "おしごと": { cn: "工作；职业（礼貌）", reading: "(o)shigoto", kanji: "お仕事", pos: "Part 5 · 职业", examples: [{ en: "おとうさんの おしごとは 何ですか。", cn: "您爸爸的工作是什么？" }] },
  "いしゃ": { cn: "医生（说自己的家人时用）", reading: "isha", kanji: "医者", pos: "Part 5 · 职业", examples: [{ en: "いしゃです。", cn: "是医生。" }] },
  "おいしゃさん": { cn: "医生（いしゃ 的礼貌说法，说别人时用）", reading: "oishasan", kanji: "お医者さん", pos: "Part 5 · 职业", examples: [{ en: "どの びょういんの おいしゃさんですか。", cn: "是哪家医院的医生？" }] },
  "びょういん": { cn: "医院", reading: "byooin", kanji: "病院", pos: "Part 5 · 职业", examples: [{ en: "びょういんに いきます。", cn: "去医院。" }] },
  "べんごし": { cn: "律师", reading: "bengoshi", kanji: "弁護士", pos: "Part 5 · 职业", examples: [{ en: "あには べんごしです。", cn: "哥哥是律师。" }] },
  "かいしゃいん": { cn: "公司职员", reading: "kaishain", kanji: "会社員", pos: "Part 5 · 职业", examples: [{ en: "チチは まえ かいしゃいんでした。", cn: "爸爸以前是公司职员。" }] },
  "しゅふ": { cn: "家庭主妇", reading: "shufu", kanji: "主婦", pos: "Part 5 · 职业", examples: [{ en: "母は 今 しゅふです。", cn: "妈妈现在是家庭主妇。" }] },
  "エンジニア": { cn: "工程师", reading: "enjinia", pos: "Part 5 · 职业", examples: [{ en: "エンジニアです。", cn: "是工程师。" }] },
  "けいかん": { cn: "警察；警官", reading: "keikan", kanji: "警察官", pos: "Part 5 · 职业", examples: [{ en: "こちらは けいかんです。", cn: "这位是警官。" }] },
  "しょうぼうし": { cn: "消防员", reading: "shoobooshi", kanji: "消防士", pos: "Part 5 · 职业", examples: [{ en: "しょうぼうしです。", cn: "是消防员。" }] },
  "ウェイター": { cn: "（男）服务员（女服务员 = ウェイトレス）", reading: "weitaa / weitoresu", pos: "Part 5 · 职业", examples: [{ en: "レストランで ウェイターを しています。", cn: "在餐厅做服务员。" }] },
  "シェフ": { cn: "厨师；主厨", reading: "shefu", pos: "Part 5 · 职业", examples: [{ en: "ちゅうか レストランの シェフです。", cn: "是中餐厅的厨师。（课本：どうようレストランのシェフです）" }] },
  "まえ": { cn: "以前；之前", reading: "mae", kanji: "前", pos: "Part 5 · 职业", examples: [{ en: "母は まえ 先生でした。", cn: "妈妈以前是老师。" }] },
  "こうむいん": { cn: "公务员", reading: "koomuin", kanji: "公務員", pos: "Part 5 · 补充词", examples: [{ en: "こうむいんです。", cn: "是公务员。" }] },
  "かいけいし": { cn: "会计师", reading: "kaikeishi", kanji: "会計士", pos: "Part 5 · 补充词", examples: [{ en: "かいけいしです。", cn: "是会计师。" }] },
  "ひしょ": { cn: "秘书", reading: "hisho", kanji: "秘書", pos: "Part 5 · 补充词", examples: [{ en: "しゃちょうの ひしょです。", cn: "是社长的秘书。" }] },
  "パイロット": { cn: "飞行员", reading: "pairotto", pos: "Part 5 · 补充词", examples: [{ en: "パイロットです。", cn: "是飞行员。" }] },
  "フライトアテンダント": { cn: "空乘；航班乘务员", reading: "furaitoatendanto", pos: "Part 5 · 补充词", examples: [{ en: "フライトアテンダントです。", cn: "是空乘。" }] },
  "ふどうさんや": { cn: "房产中介；不动产商", reading: "fudoosanya", kanji: "不動産屋", pos: "Part 5 · 补充词", examples: [{ en: "ふどうさんやで はたらいています。", cn: "在房产中介工作。" }] },
  "しゃちょう": { cn: "社长；公司总经理", reading: "shachoo", kanji: "社長", pos: "Part 5 · 补充词", examples: [{ en: "しゃちょうです。", cn: "是社长。" }] },
  "かんごし": { cn: "护士", reading: "kangoshi", kanji: "看護師", pos: "Part 5 · 补充词", examples: [{ en: "かんごしです。", cn: "是护士。" }] },
  "びようし": { cn: "美发师；理发师", reading: "biyooshi", kanji: "美容師", pos: "Part 5 · 补充词", examples: [{ en: "びようしです。", cn: "是美发师。" }] },
  "やくざいし": { cn: "药剂师", reading: "yakuzaishi", kanji: "薬剤師", pos: "Part 5 · 补充词", examples: [{ en: "やくざいしです。", cn: "是药剂师。" }] }
};
