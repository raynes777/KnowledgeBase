package com.ctd.controller;

import com.ctd.dto.request.LoginRequest;
import com.ctd.dto.request.RegisterRequest;
import com.ctd.dto.response.JwtAuthenticationResponse;
import com.ctd.model.User;
import com.ctd.security.JwtTokenProvider;
import com.ctd.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = User.builder()
            .email(request.getEmail())
            .passwordHash(request.getPassword())  // Will be hashed in service
            .name(request.getName())
            .role(request.getRole())
            .organization(request.getOrganization())
            .build();

        User registered = authService.registerUser(user);

        return ResponseEntity.ok(Map.of(
            "message", "User registered successfully",
            "userId", registered.getId(),
            "iotaDid", registered.getIotaDid()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }
}
