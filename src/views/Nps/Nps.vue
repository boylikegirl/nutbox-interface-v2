<template>
  <div class="page-view-content nps">
    <div class="page-view-title">{{ this.$t("nps.nps") }}</div>
    <div style="text-align:left;margin-top:1rem">{{ $t('nps.npsTemp') }}</div>
    <div class="nps-card" v-for="(item, index) in proposalList" :key="item.num">
      <div class="proposal">
        <p
          style="
            width: 32px;
            height: 32px;
            border-radius: 16px;
            border: 1px solid var(--primary);
            font-size: 14px;
            line-height: 32px;
          "
        >
          {{ index + 1 }}
        </p>
        <a
          target="_blank"
          :href="'https://blog.nutbox.io/@' + item.author"
          style="width: 100px; text-align: left"
        >
          {{ item.author }}
        </a>
        <a
          target="_blank"
          :href="'https://blog.nutbox.io/@' + item.author + '/' + item.permlink"
          style="
            flex: 1;
            text-align: left;
            font-weight: 500;
            border-radius: 8px;
          "
        >
          {{ item.title }}
        </a>
        <p
          :class="item.status"
          style="
            font-size: 14px;
            font-weight: 600;
            line-height: 24px;
            padding: 0px 6px;
          "
        >
          <!--{{ new Date(item.timestamp+'Z') | timeFormat}} -->
          {{ statusDesc(item.status) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { getProposal } from "@/apis/api";
import Card from "@/components/ToolsComponents/Card";
import { getDateString } from "@/utils/helper";

export default {
  name: "Nps",
  data() {
    return {
      proposalList: [],
    };
  },
  filters: {
    timeFormat: function (value) {
      return getDateString(value, 8);
    },
  },
  components: {
    Card,
  },
  methods: {
    statusDesc(status) {
      if (status === "pass") {
        return this.$t("nps.pass");
      } else if (status === "pending") {
        return this.$t("nps.pending");
      } else if (status === "unpass") {
        return this.$t("nps.unpass");
      } else if (status === 'rolling'){
        return this.$t("nps.rolling")
      }
    },
  },
  async mounted() {
    const res = await getProposal();
    this.proposalList = res;
  },
};
</script>

<style lang="less" scoped>
.nps {
  .nps-card {
    height: 108px;
    background: white;
    padding: 18px;
    margin-top: 20px;
    box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.02);
    border-radius: 28px;
    border: 1px solid rgba(227, 229, 232, 0.5);
  }
  .proposal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 72px;
    p,
    a {
      margin: 0 10px;
      color: var(--primary-text);
      font-size: 16px;
      -webkit-line-clamp: 3;
      overflow: hidden;
      word-break: break-all;
      text-overflow: ellipsis;
      max-height: 60px;
      font-weight: 600;
      line-height: 20px;
    }
    a:hover {
      color: var(--link);
    }

    .pass {
      background: rgba(80, 191, 0, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(80, 191, 0, 0.3);
      color: var(--success);
    }
    .pending {
      background: rgba(255, 219, 38, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 219, 38, 0.3);
      color: var(--warning);
    }
    .unpass {
      background: rgba(255, 91, 77, 0.051);
      border-radius: 8px;
      border: 1px solid rgba(255, 91, 77, 0.3);
      color: var(--error);
    }
    .rolling {
      background: #408fff0d;
      border-radius: 8px;
      border: 1px solid #408fff4d;
      color: var(--link);
    }
  }
}
</style>
