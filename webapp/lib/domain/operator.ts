/**
 * 一人で回す前提。
 *
 * この組織に人間は1人しかいない。社員はいない。仕事をするのは
 * あなたとAgentだけで、判断する人間はあなた1人。
 *
 * これは「今は小さいから」という一時的な話ではなく、設計の前提として扱う。
 * 人が増える前提で作ると、増えるまでずっと使えないものができる。
 * 社員がいる会社向けの形（役割ごとに画面を分ける版）は、
 * このシステムを他社に売るときに必要になるもので、いま要るものではない。
 *
 * 人が1人しかいないと、何が変わるか:
 *
 * 1. 承認が全部1人に来る。溜まった時点で全部止まる。
 * 2. 「誰に割り振るか」が無い。担当はAgentか自分かの2択。
 * 3. 唯一の限りある資源は自分の時間。Agentの処理能力ではない。
 * 4. 自分が倒れたら全部止まる。記録が残っていることだけが保険になる。
 */

export interface OperatorLimits {
  /**
   * 承認待ちの上限。
   *
   * これを超えたら新しい案件を受け付けない。
   * 溜まった承認は、中身を見ずに押すようになる。そうなった時点で
   * 承認ゲートは機能していないので、件数で止めるほうが安全。
   */
  maxPendingApprovals: number;

  /**
   * 1日に自分が使える時間（分）。
   *
   * Agentは並列に動くが、判断はここを通る。ここが詰まれば全部詰まる。
   */
  dailyMinutes: number;

  /**
   * 受けられる侵襲度の上限。
   *
   * L3以上は、事故ったときに復旧できる人間が自分しかいない状態で
   * 顧客の業務を止めることになる。一人のうちは受けない。
   */
  maxInvasionLevel: "L0" | "L1" | "L2" | "L3" | "L4";

  /**
   * 同時に進められる案件の数。
   *
   * 相手の返事待ちの案件は数えない。手が空くため。
   */
  maxActiveEngagements: number;
}

/** 一人で回すときの既定値。増員したらここを書き換える。 */
export const SOLO_LIMITS: OperatorLimits = {
  maxPendingApprovals: 5,
  dailyMinutes: 240,
  maxInvasionLevel: "L2",
  maxActiveEngagements: 3,
};

/** 上限に対して、いま余裕があるかどうか。 */
export interface Capacity {
  label: string;
  now: number;
  limit: number;
  /** 上限に達していて、これ以上受けてはいけない状態か */
  full: boolean;
  /** 超えたときに何が起きるか。数字だけ見せても判断できない。 */
  consequence: string;
}

export function checkCapacity(
  counts: { pendingApprovals: number; activeEngagements: number },
  limits: OperatorLimits = SOLO_LIMITS,
): Capacity[] {
  return [
    {
      label: "承認待ち",
      now: counts.pendingApprovals,
      limit: limits.maxPendingApprovals,
      full: counts.pendingApprovals >= limits.maxPendingApprovals,
      consequence:
        "溜まると中身を見ずに押すようになる。そうなったら承認ゲートは無いのと同じ",
    },
    {
      label: "進行中の案件",
      now: counts.activeEngagements,
      limit: limits.maxActiveEngagements,
      full: counts.activeEngagements >= limits.maxActiveEngagements,
      consequence:
        "相手の返事待ちは数えていない。手を動かす案件だけで数える",
    },
  ];
}

/** 一人のうちは受けない侵襲度かどうか。 */
export function isTooDeep(
  level: string,
  limits: OperatorLimits = SOLO_LIMITS,
): boolean {
  const order = ["L0", "L1", "L2", "L3", "L4"];
  return order.indexOf(level) > order.indexOf(limits.maxInvasionLevel);
}
