/**
 * 案件（Engagement）— 相談から運用までの一連の取引。
 *
 * これまでの Run は「1回の処理」しか表せなかった。実際の仕事は数週間続き、
 * 相手の返事を待つ場所が何度かある。Run はこの中の「制作」で発生する
 * 作業単位に格下げになる。
 *
 * 段階の切れ目は「相手の返事待ちになる場所」に置く。
 * 自分の中だけで進む部分は分けない。分けると、動いていないのに
 * 段階だけ進むという嘘の進捗が生まれる。
 */

export type EngagementStage =
  | "相談"
  | "提案"
  | "制作"
  | "納品"
  | "完了"
  | "運用"
  // 行き止まり
  | "見送り"
  | "中止";

export const ACTIVE_STAGES: EngagementStage[] = [
  "相談",
  "提案",
  "制作",
  "納品",
  "完了",
  "運用",
];

export const DEAD_END_STAGES: EngagementStage[] = ["見送り", "中止"];

/**
 * 顧客のシステムにどれだけ踏み込むか。
 *
 * 「業務基盤を土台から変えるのは難しい」という制約への答え。
 * 低いほど売りやすく、事故っても影響が小さい。高いほど単価が上がるが、
 * ヒアリングと信頼が要る。相談の段階でここを確定させないと、
 * ソフトウェア開発なのかSaaSなのかも決まらない。
 */
export type InvasionLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export const INVASION_LEVELS: Record<
  InvasionLevel,
  { label: string; detail: string; example: string; risk: string }
> = {
  L0: {
    label: "触らない",
    detail: "顧客のシステムに一切アクセスしない",
    example: "SNS運用、コンテンツ制作、調査レポート",
    risk: "事故っても影響が自社内で収まる",
  },
  L1: {
    label: "読むだけ",
    detail: "顧客のファイルを読み取る",
    example: "Drive・Dropboxから読んで集計する",
    risk: "読むだけなので相手のデータは壊れない",
  },
  L2: {
    label: "ファイルに書く",
    detail: "顧客のファイルに追記・更新する",
    example: "Excel・スプレッドシートへの転記",
    risk: "元ファイルが壊れうる。バックアップが要る",
  },
  L3: {
    label: "業務システムに書く",
    detail: "顧客の基幹システムを更新する",
    example: "CRM・会計ソフトへの登録",
    risk: "業務が止まる。全件承認から始める",
  },
  L4: {
    label: "業務フローを置き換える",
    detail: "既存の仕事のやり方そのものを変える",
    example: "受発注プロセスの刷新",
    risk: "会社が止まる。実績と信頼が無ければ受けない",
  },
};

/** どこから話が来たか。動線の分析に使う。 */
export type LeadSource =
  | "紹介"
  | "SNS"
  | "問い合わせフォーム"
  | "既存顧客からの追加"
  | "自分から提案"
  | "その他";

// ---------------------------------------------------------------------------
// 打ち合わせ
//
// 相談も提案も1回では終わらない。3回4回と回るのが普通なので、
// 段階の中で繰り返せる形にする。
//
// 各回で一番重要なのは stillUnknown（まだ分からないこと）。
// これが次回の議題になり、これが空になったときに次の段階へ進める。
// 「なんとなく分かった気がする」で提案を書き始めると、後で必ず戻る。
// ---------------------------------------------------------------------------

export interface Meeting {
  meetingId: string;
  /** 何回目か */
  round: number;
  heldAt: string;
  /** 誰が出たか。決裁者が出た回かどうかが後で効く。 */
  attendees: string[];
  /** この回で聞けたこと */
  learned: string[];
  /** まだ分からないこと。次回の議題。 */
  stillUnknown: string[];
  /** 相手の反応。前向きか、渋いか。 */
  clientReaction?: string;
  /** 次にこちらがやること */
  nextAction: string;
  /** この回に向けて用意した資料 */
  materials: string[];
}

// ---------------------------------------------------------------------------
// 相談で埋めるもの
// ---------------------------------------------------------------------------

export interface Hearing {
  /** 打ち合わせの記録。1回とは限らない。 */
  meetings: Meeting[];
  /** 相手が困っていること。相手の言葉のまま書く。要約しない。 */
  problem: string;
  /** 今かかっている時間・件数。ここが空だと効果を測れない。 */
  baseline: string;
  /** すでに使っている道具 */
  existingTools: string[];
  /**
   * 触ってはいけないもの。
   *
   * ヒアリングで一番大事な項目。「基幹システムには触らないでほしい」
   * 「この担当者の仕事は残してほしい」など。ここを聞かずに提案すると、
   * 良い提案ほど断られる。
   */
  untouchable: string[];
  /** 侵襲度。ここが決まらないと提案が書けない。 */
  invasionLevel?: InvasionLevel;
  /** 決裁者。この人がOKしないと契約にならない。 */
  decisionMaker: string;
  /** 相手が警戒していること */
  concern: string;
  heardAt?: string;
}

// ---------------------------------------------------------------------------
// 提案
// ---------------------------------------------------------------------------

/**
 * 1体のAgentが、その案件について出した意見。
 *
 * 顧客の希望をそのまま提案書にすると、できない約束が混ざる。
 * 提案書を書く前に、各Agentに「できるか / どうやるか / どこが危ないか」を
 * 出させて、その集約として提案書を組み立てる。
 *
 * 誰の意見かを残すのが要点。匿名の箇条書きにすると、
 * 後で「この懸念は誰が言ったのか」を追えなくなり、責任の所在が消える。
 */
export interface AgentOpinion {
  agentId: string;
  /** こうすればできる、という案 */
  ideas: string[];
  /** ここが危ない、という指摘 */
  concerns: AgentConcern[];
  /** うちでは無理、という線引き。これが提案書の「やらないこと」の元になる。 */
  cannotDo: string[];
  feasibility: "できる" | "条件つきでできる" | "できない";
}

export interface AgentConcern {
  /** 何が危ないか */
  concern: string;
  /**
   * 提案書でどう答えたか。
   *
   * 空のまま提案を出さない。答えていない懸念は、
   * 制作か納品のどちらかで必ず表に出てくる。
   */
  answer?: string;
}


export interface Proposal {
  /** 第何版か。断られたら改善して次の版を出す。 */
  version: number;
  /**
   * 顧客の希望を、相手の言葉のまま。
   *
   * こちらの解釈に直したものを置かない。直した瞬間に、
   * 提案がずれていても気づけなくなる。
   */
  clientWish: string;
  /**
   * この版を作るときに各Agentが出した意見。
   *
   * 提案書の本文（scope / outOfScope / amount）は、ここからの集約であって、
   * 思いつきではない。版が変わればここも取り直す。
   */
  opinions: AgentOpinion[];
  /** やること */
  scope: string[];
  /**
   * やらないこと。
   *
   * scope と同じ重さで必要。書かないと「これもやってくれると思った」
   * が必ず起きる。制作会社が揉める原因の大半がここ。
   */
  outOfScope: string[];
  /** 金額（円） */
  amount: number;
  /** 期間 */
  duration: string;
  /** 前提条件。これが崩れたら再見積もり。 */
  assumptions: string[];
  proposedAt?: string;

  /** 出した結果 */
  outcome?: "承諾" | "保留" | "修正依頼" | "見送り";
  /**
   * 相手からの指摘。次の版の入力になる。
   *
   * ここを残さずに版だけ重ねると、同じ指摘を繰り返し受ける。
   */
  feedback?: string;
}

// ---------------------------------------------------------------------------
// 成果物
// ---------------------------------------------------------------------------

export interface Deliverable {
  deliverableId: string;
  name: string;
  /** 何で渡すか */
  format: string;
  /** どうやって渡すか */
  handoverMethod: string;
  /** この成果物を作ったRun */
  fromRunId?: string;
  deliveredAt?: string;
}

// ---------------------------------------------------------------------------
// インシデント（納品後に起きたこと）
// ---------------------------------------------------------------------------

export type IncidentSeverity = "軽微" | "業務に影響" | "業務が止まる";

export interface Incident {
  incidentId: string;
  /** 相手から見て何が起きたか。技術的な原因ではなく、相手の言葉で。 */
  symptom: string;
  severity: IncidentSeverity;
  reportedAt: string;
  reportedBy: string;
  /**
   * 原因がどちら側にあるか。
   *
   * 制作会社にとってここが曖昧だと、無償対応が無限に増える。
   * 判明するまでは "調査中" のままにする。推測で自社と書かない。
   */
  cause: "自社" | "顧客側" | "外部要因" | "調査中";
  resolvedAt?: string;
  resolution?: string;
  /** この対応が有償か無償か。cause が決まるまで決めない。 */
  billable?: boolean;
}

// ---------------------------------------------------------------------------
// 段階の遷移記録
// ---------------------------------------------------------------------------

export interface StageTransition {
  from: EngagementStage | null;
  to: EngagementStage;
  at: string;
  by: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// 案件本体
// ---------------------------------------------------------------------------

export interface Engagement {
  engagementId: string;
  /** 顧客の識別子。全データに付く。 */
  clientId: string;
  clientName: string;
  title: string;
  stage: EngagementStage;

  /** どこから来たか */
  leadSource: LeadSource;
  /** 紹介元など、経路の詳細 */
  leadDetail?: string;

  hearing: Hearing;
  /** 提案の版。断られたら改善して次を出すので配列。 */
  proposals: Proposal[];

  /** 制作で発生した作業単位。Run はこの中に入る。 */
  runIds: string[];
  deliverables: Deliverable[];
  incidents: Incident[];

  history: StageTransition[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 段階を進める条件
//
// 「次へ」ボタンを押せるかどうかを、気合いではなくデータで決める。
// 埋まっていない項目があるまま進めると、後の段階で必ず戻ってくる。
// ---------------------------------------------------------------------------

export interface GateCheck {
  label: string;
  ok: boolean;
  /** 満たしていないときに何をすればよいか */
  hint: string;
}

/** 最新の提案（最後に出した版）。まだ出していなければ undefined。 */
export function latestProposal(e: Engagement): Proposal | undefined {
  return e.proposals.at(-1);
}

/**
 * 最新の提案で、まだ答えていない懸念。
 * ここが空にならないうちは提案を出さない。
 */
export function unansweredConcerns(
  e: Engagement,
): { agentId: string; concern: string }[] {
  const p = latestProposal(e);
  if (!p) return [];
  return p.opinions.flatMap((o) =>
    o.concerns
      .filter((c) => !c.answer?.trim())
      .map((c) => ({ agentId: o.agentId, concern: c.concern })),
  );
}

/** 最新の打ち合わせ。まだ1回もしていなければ undefined。 */
export function latestMeeting(e: Engagement): Meeting | undefined {
  return e.hearing.meetings.at(-1);
}

/**
 * まだ分からないことの一覧（最新の打ち合わせの分）。
 * 次回の議題になる。ここが空になって初めて次の段階へ進める。
 */
export function openQuestions(e: Engagement): string[] {
  return latestMeeting(e)?.stillUnknown ?? [];
}

export function checkGate(e: Engagement): {
  next: EngagementStage | null;
  checks: GateCheck[];
  canAdvance: boolean;
} {
  const checks: GateCheck[] = [];
  let next: EngagementStage | null = null;
  const proposal = latestProposal(e);

  switch (e.stage) {
    case "相談":
      next = "提案";
      checks.push(
        {
          label: "打ち合わせを1回以上している",
          ok: e.hearing.meetings.length > 0,
          hint: "話を聞かずに提案を書き始めない",
        },
        {
          label: "分からないことが残っていない",
          ok: e.hearing.meetings.length > 0 && openQuestions(e).length === 0,
          hint:
            openQuestions(e).length > 0
              ? `残り${openQuestions(e).length}件。次回の打ち合わせで聞く`
              : "「なんとなく分かった」で提案を書くと必ず戻る",
        },
        {
          label: "困っていることが書かれている",
          ok: e.hearing.problem.trim().length > 0,
          hint: "相手の言葉のまま記録する",
        },
        {
          label: "現状の時間・件数が分かっている",
          ok: e.hearing.baseline.trim().length > 0,
          hint: "ここが空だと、後で効果を数字で示せない",
        },
        {
          label: "触ってはいけないものを聞いている",
          ok: e.hearing.untouchable.length > 0,
          hint: "聞かずに提案すると、良い提案ほど断られる",
        },
        {
          label: "侵襲度が決まっている",
          ok: Boolean(e.hearing.invasionLevel),
          hint: "ここでソフトウェア開発かSaaSかが決まる",
        },
        {
          label: "決裁者が分かっている",
          ok: e.hearing.decisionMaker.trim().length > 0,
          hint: "この人がOKしないと契約にならない",
        },
      );
      break;

    case "提案":
      next = "制作";
      checks.push(
        {
          label: "提案を1版以上出している",
          ok: e.proposals.length > 0,
          hint: "まだ1版も出していない",
        },
        {
          label: "やることが書かれている",
          ok: (proposal?.scope.length ?? 0) > 0,
          hint: "提案の中身",
        },
        {
          label: "やらないことが書かれている",
          ok: (proposal?.outOfScope.length ?? 0) > 0,
          hint: "書かないと「これもやると思った」が必ず起きる",
        },
        {
          label: "金額が入っている",
          ok: (proposal?.amount ?? 0) > 0,
          hint: "無償で始めない",
        },
        {
          label: "各Agentの意見を取っている",
          ok: (proposal?.opinions.length ?? 0) > 0,
          hint: "誰にも聞かずに書いた提案書は、できない約束が混ざる",
        },
        {
          label: "Agentが出した懸念に全部答えている",
          ok: unansweredConcerns(e).length === 0,
          hint:
            unansweredConcerns(e).length > 0
              ? `未回答${unansweredConcerns(e).length}件。制作か納品で必ず表に出る`
              : "答えていない懸念を残したまま出さない",
        },
        {
          label: "前の版の指摘に答えている",
          ok: e.proposals
            .slice(0, -1)
            .every((p) => Boolean(p.feedback?.trim())),
          hint: "断られた版に理由が残っていない。同じ指摘を繰り返し受ける",
        },
        {
          label: "相手が承諾した",
          ok: proposal?.outcome === "承諾",
          hint:
            proposal?.outcome === "修正依頼"
              ? "修正依頼が来ている。指摘を反映して次の版を出す"
              : "相手の返事待ち。承諾を確認してから進める",
        },
      );
      break;

    case "制作":
      next = "納品";
      checks.push(
        {
          label: "成果物が1つ以上ある",
          ok: e.deliverables.length > 0,
          hint: "渡すものが無いのに納品はできない",
        },
        {
          label: "渡し方が決まっている",
          ok:
            e.deliverables.length > 0 &&
            e.deliverables.every((d) => d.handoverMethod.trim().length > 0),
          hint: "どうやって相手に渡すか",
        },
      );
      break;

    case "納品":
      next = "完了";
      checks.push(
        {
          label: "成果物を渡した",
          ok: e.deliverables.some((d) => Boolean(d.deliveredAt)),
          hint: "渡した日時を記録する",
        },
        {
          label: "相手がOKした",
          ok: false,
          hint: "相手の確認待ち。検収を得てから請求する",
        },
      );
      break;

    case "完了":
      next = "運用";
      checks.push({
        label: "保守の取り決めがある",
        ok: false,
        hint: "運用に入るなら、範囲と費用を決める。無ければここで終わり",
      });
      break;

    case "運用":
      next = null;
      checks.push({
        label: "未解決のインシデントがない",
        ok: e.incidents.every((i) => Boolean(i.resolvedAt)),
        hint: "対応中のものが残っている",
      });
      break;

    default:
      next = null;
  }

  return {
    next,
    checks,
    canAdvance: next !== null && checks.every((c) => c.ok),
  };
}
