package com.ctd.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class IotaConfig {

    @Value("${iota.enabled:false}")
    private boolean iotaEnabled;

    @Value("${iota.network:testnet}")
    private String network;

    @Value("${iota.node-url:https://api.testnet.shimmer.network}")
    private String nodeUrl;

    // TODO Phase 2: Bean per IotaClient quando si attiva integrazione reale
    // @Bean
    // @ConditionalOnProperty(name = "iota.enabled", havingValue = "true")
    // public IotaClient iotaClient() {
    //     return new IotaClient.Builder()
    //         .withNode(nodeUrl)
    //         .build();
    // }
}
