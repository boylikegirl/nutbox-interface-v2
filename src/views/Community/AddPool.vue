<template>
  <div class="page-view-content">
    <Step v-show="createState !== 0" :current-step="createState"></Step>
    <div class="flex-between-center">
      <div class="page-back-text-icon font20" @click="$router.back()">{{ $t('asset.addPool') }}</div>
    </div>
    <div class="scroll-content">
      <div class="pool-card text-left">
        <div class="line-card-title">{{ $t('asset.poolRatios') }}</div>
        <div class="custom-form pool-form">
          <b-form-group id="input-group-1"
                        :label="$t('asset.stakingAsset')"
                        label-for="input-1">
            <Dropdown :menu-options="concatAddressOptions"
                      :loading="assetLoading"
                      :selected-key="selectedKey"
                      :selected-item="selectedAddressData"
                      @setSelectedData="setSelectedData">
              <template v-slot:empty0>
                <div class="text-center">
                  <div class="custom-control" style="line-height: 1.5rem">
                    {{ $t('asset.notRegister') }}
                    <router-link to="/community/register/native">{{ $t('asset.registerOne') }}</router-link>
                  </div>
                </div>
              </template>
              <template v-slot:drop-item="slotProps">
                <img class="prefix-icon" :src="slotProps.item.icon" alt="">
                <div class="flex-full d-flex flex-column">
                  <span>{{slotProps.item.symbol}}</span>
                  <span class="font12 text-grey-light">{{slotProps.item.asset | formatUserAddress}}</span>
                </div>
              </template>
            </Dropdown>
            <div class="flex-between-center mt-1">
              <div class="text-left text-grey-light ">
                <span v-show="form.assetId && isHomeChainAsset">* {{ $t('asset.isHomeAsset') }}</span>
                <span v-show="form.assetId && !isHomeChainAsset">* {{ $t('asset.isForeignAsset') }}</span>
              </div>
              <router-link class="text-right" to="/community/register/native">{{ $t('asset.registerOne') }}</router-link>
            </div>
          </b-form-group>
          <div class="row">
            <b-form-group class="col-md-6"
                          id="input-group-2"
                          :label="$t('asset.poolName')"
                          label-for="input-2">
              <b-form-input
                id="input-2"
                v-model="form.name"
                :placeholder="$t('asset.inputPoolName')"
                @input="inputChange"
                @keyup="poolNameChange"
                required
              ></b-form-input>
            </b-form-group>
          </div>
          <b-form-group id="input-group-2"
                        :label="$t('asset.poolRatios')">
            <div class="ratios-box">
              <div class="text-center item-box"
                   v-for="(inputItem, inputIndex) of form.ratios" :key="inputIndex">
                <b-form-input class="ration-input"
                              :data-label="options.series[0].data[inputIndex].name"
                              v-model="form.ratios[inputIndex]"
                              @input="inputChange"
                              step="0.01"
                              type="number"
                ></b-form-input>
                <span class="font12 text-grey mt-1">{{ options.series[0].data[inputIndex].name }}</span>
              </div>
            </div>
          </b-form-group>
          <div class="row">
            <div class="col-md-5">
              <button class="primary-btn" @click="confirmAdd" :disabled="adding">
                <b-spinner small type="grow" v-show="adding" />
                {{ $t('commen.add') }}
              </button>
            </div>
          </div>
        </div>
        <div class="divide-box">
          <div class="line-card-title">{{ $t('asset.poolInfo') }}</div>
        </div>
         <div class="row">
          <div class="col-lg-6 col-md-7">
            <div id="pie"></div>
          </div>
          <div class="col-lg-6 col-md-5 legend-box">
            <div class="legend-info" v-for="(item, index) of options.series[0].data" :key="index">
              <span class="circle" :style="{'border-color': colorList[index]}"></span>
              <span class="name">{{ item.name||'--' }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts/core'
import debounce from 'lodash.debounce'
import Dropdown from '@/components/ToolsComponents/Dropdown'
import { getRegitryAssets } from '@/utils/web3/asset'
import { DELEGATION_CHAINID_TO_NAME, CROWDLOAN_CHAINID_TO_NAME, VALIDATOR_CHAINID_TO_NAME } from '@/config'
import { stanfiAddress } from '@/utils/commen/account'
import { addPool, getMyOpenedPools } from '@/utils/web3/pool'
import { handleApiErrCode } from '@/utils/helper'
import Step from '@/components/ToolsComponents/Step'
import { mapGetters } from 'vuex'
import { OfficialAssets } from '@/config'

export default {
  name: 'AddPool',
  components: { Dropdown, Step },
  data () {
    return {
      isHomeChainAsset: true,
      adding: true,
      myPools:[],
      colorList: ['#FF7366', '#7CBF4D', '#70ACFF', '#FFE14D', '#CC85FF', '#FF9500', '#00C7D9', '#9D94FF', '#FF73AD'],
      options: {
        tooltip: { show: true, trigger: 'item' },
        legend: { show: false },
        series: [
          {
            name: '',
            type: 'pie',
            radius: ['40%', '60%'], // 圆环大小
            avoidLabelOverlap: false,
            label: {
              show: true,
              formatter: '{d}%',
              fontSize: 14,
              fontWeight: 'bolder'
            },
            labelLine: {
              show: false
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              extraCssText: 'box-shadow: 0 4 12px 4px rgba(0, 0, 0, 0.05); border-radius: .6rem;',
              borderWidth: 0,
              textStyle: {
                color: '#242629',
                fontSize: 12
              },
              formatter: `<div class="c-tooltip"><span>Pool</span><span>{b0}</span></div>
                <div class="c-tooltip"><span>${this.$i18n.t('percentage')}</span><span>{d}%</span></div>`
              // 饼图、仪表盘、漏斗图: {a}（系列名称），{b}（数据项名称），{c}（数值）, {d}（百分比）
            },
            data: [{ value: 0, name: 'default' }]
          }
        ]
      },
      form: {
        assetId: '',
        name: '',
        ratios: [0]
      },
      selectedKey: 'name',
      selectedAddressData: {},
      concatAddressOptions: [
        {
          categoryName: 'personal',
          items: [{ name: 'AAA', address: '0x000' }]
        },
        {
          categoryName: 'official',
          items: OfficialAssets
        }
      ],
      assetLoading: true,
    }
  },
  computed: {
    ...mapGetters('web3', ['createState'])
  },
  async mounted () {
    getMyOpenedPools().then(pools => {
      this.initChart(pools)
      this.adding = false
    }).catch(e => {
      handleApiErrCode(e, (tip, param) => {
        this.$bvToast.toast(tip, param)
      })
    })
    this.assetLoading = true
    try{
      let assets = await getRegitryAssets()
      console.log('my assets', assets);
      assets = assets.map(asset => {
        switch (asset.type) {
          case 'HomeChainAssetRegistry':
            return {
              icon: asset.icon,
              name: asset.name,
              symbol: asset.symbol,
              asset: asset.asset,
              isHomeChainAsset: true
            }
          case 'SteemHiveDelegateAssetRegistry':
            return {
              icon: asset.icon,
              name: DELEGATION_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.delegation'),
              symbol: DELEGATION_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.delegation'),
              asset: asset.asset,
              isHomeChainAsset: false
            }
          case 'SubstrateCrowdloanAssetRegistry':
            return {
              icon: asset.icon,
              name: CROWDLOAN_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.crowdloan') + ':' + asset.paraId + '-' + asset.trieIndex,
              symbol: CROWDLOAN_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.crowdloan') + ':' + asset.paraId + '-' + asset.trieIndex,
              asset: asset.asset,
              isHomeChainAsset: false
            }
          case 'SubstrateNominateAssetRegistry':
            return {
              icon: asset.icon,
              name: VALIDATOR_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.validator') + ':' + stanfiAddress(asset.validatorAccount),
              symbol: VALIDATOR_CHAINID_TO_NAME[asset.chainId] + ' ' + this.$t('asset.validator') + ':' + stanfiAddress(asset.validatorAccount),
              asset: asset.asset,
              isHomeChainAsset: false
            }
        }
      })
      this.concatAddressOptions[0].items = assets
    }catch(e) {
      handleApiErrCode(e, (tip, param) => {
        this.$bvToast.toast(tip, param)
      })
    }

    this.assetLoading = false
  },
  methods: {
    initChart (pools) {
      this.chart = echarts.init(document.getElementById('pie'))
      this.setData(pools)
      this.chart.setOption(this.options)
    },
    setData (pools) {
      this.options.color = this.colorList
      const data = { value: 100, name: this.form.name }
      this.myPools = pools.map(pool => ({name: pool.poolName, value: pool.poolRatio / 100}))
      this.myPools.push(data)
      this.options.series[0].data = this.myPools
      this.form.ratios = this.myPools.map(item => {
        return item.value
      })
    },
    poolNameChange() {
      if(this.form.name.length > 30){
        this.form.name = this.form.name.slice(0, 30)
      }
    },
    inputChange: debounce(function () {
      this.options.series[0].data.map((item, index) => {
        item.value = this.form.ratios[index]
      })
      this.options.series[0].data[this.options.series[0].data.length - 1].name = this.form.name
      this.chart.setOption(this.options)
    }, 1500),
    setSelectedData (data) {
      this.selectedAddressData = data
      this.isHomeChainAsset = data.isHomeChainAsset
      this.form.assetId = data.asset
    },
    checkInput () {
      let tipStr = ''
      if (!this.form.assetId) {
        tipStr = this.$t('asset.selectStakingAsset')
      } else if (!this.form.name) {
        tipStr = this.$t('asset.inputPoolName')
      }else if(this.form.ratios.reduce((t, r) => t+parseInt(r * 100),0) != 10000){
        tipStr = this.$t('tip.ratioError')
      } else {
        return true
      }
      this.$bvToast.toast(tipStr, {
        title: this.$t('tip.tips'),
        variant: 'info'
      })
      console.log(tipStr)
    },
    async confirmAdd () {
      if (!this.checkInput()) return

      // add pool
      try {
        this.adding = true
        const hash = await addPool(this.form)
        this.$bvToast.toast(this.$t('community.addPoolSuccess'), {
          title: this.$t('tip.deployFactorySuccess'),
          variant: 'success'
        })
        try{
          await getMyOpenedPools(true)
          this.$router.back();
        }catch(e){}
      } catch (e) {
        handleApiErrCode(e, (info, para) => {
          this.$bvToast.toast(info, para)
        })
      } finally {
        this.adding = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import "src/static/css/form";

.page-back-text-icon {
  margin-bottom: 2.3rem;
}

.pool-card {
  @include card(1.6rem 0);
  height: auto;

  .line-card-title {
    font-size: 1rem;
    line-height: 1rem;
    font-weight: bold;
    padding-left: 1.2rem;
    @include single-color-bg(.2rem 1rem, left center);
  }

  .legend-box {
    display: flex;
    flex-direction: column;
    gap: .8rem;
    justify-content: center;
    align-items: center;
    margin: 2rem 0;
  }

  .legend-info {
    display: flex;
    align-items: center;

    span {
      display: inline-block;
    }

    .circle {
      width: .7rem;
      height: .7rem;
      border-radius: 1rem;
      margin-right: .6rem;
      border: .2rem solid;
    }
    .name {
      width: 10rem;
    }
    .value {
      min-width: 4rem;
      text-align: right;
    }
  }

  .divide-box {
    background-image: linear-gradient(to bottom, #F6F7F9, #FFFFFF);
    padding: 1.6rem 0 .4rem;
  }
}

#pie {
  width: 100%;
  height: 15rem;
}

.pool-form {
  padding: 1rem 1.2rem 1.2rem;

  .ratios-box {
    display: flex;
    flex-flow: wrap;
  }

  .item-box {
    padding-left: .2rem;
    padding-right: .8rem;
    @include single-color-bg(.6rem .1rem, right 1.2rem, #BDBFC2)
  }

  .item-box:first-child {
    padding-left: 0;
  }

  .item-box:last-child {
    padding-right: 0;
  }

  .ration-input {
    width: 5.8rem;
    text-align: center;
    font-size: 1rem;
    font-weight: bolder;

    &::after {
      content: '--';
    }
  }
}
</style>
